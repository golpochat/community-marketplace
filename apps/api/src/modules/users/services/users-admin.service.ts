import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { RbacRole, User, UserBan } from '@community-marketplace/types';
import {
  adminUserListQuerySchema,
  banUserSchema,
  suspendUserSchema,
} from '@community-marketplace/validation';

import { AuthorizationService } from '../../../common/authorization/authorization.service';
import { assertBootstrapSuperAdminImmutable } from '../../../common/constants/bootstrap-users';
import { PrismaService } from '../../../database/prisma.service';
import { mapUser, mapUserProfile, userProfileInclude } from '../mappers/user.mapper';
import { UserAuditService } from './user-audit.service';

@Injectable()
export class UsersAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: UserAuditService,
    private readonly authorization: AuthorizationService,
  ) {}

  async listUsers(query: unknown) {
    const parsed = adminUserListQuerySchema.parse(query ?? {});
    const page = parsed.page ?? 1;
    const limit = parsed.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(parsed.status ? { status: parsed.status } : {}),
      ...(parsed.role ? { primaryRole: { code: parsed.role } } : {}),
      ...(parsed.search
        ? {
            OR: [
              { email: { contains: parsed.search, mode: 'insensitive' } },
              { displayName: { contains: parsed.search, mode: 'insensitive' } },
              { profile: { phone: { contains: parsed.search } } },
            ],
          }
        : {}),
      ...(parsed.verificationStatus
        ? {
            verifications: {
              some: { status: parsed.verificationStatus },
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: userProfileInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: rows.map((row) => mapUserProfile(row)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        ...userProfileInclude,
        bans: { where: { liftedAt: null }, orderBy: { createdAt: 'desc' }, take: 5 },
        settings: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      profile: mapUserProfile(user),
      activeBans: user.bans.map((ban) => this.mapBan(ban)),
      settings: user.settings
        ? {
            deletionRequestedAt: user.settings.deletionRequestedAt?.toISOString(),
          }
        : null,
    };
  }

  async suspendUser(actorId: string, actorRole: RbacRole, input: unknown) {
    const parsed = suspendUserSchema.parse(input);
    await this.assertCanManageUser(actorId, actorRole, parsed.userId);

    await this.prisma.user.update({
      where: { id: parsed.userId },
      data: { status: 'suspended' },
    });

    await this.audit.record('user_suspended', actorId, parsed.userId, { reason: parsed.reason });
    return { userId: parsed.userId, status: 'suspended' };
  }

  async unsuspendUser(actorId: string, actorRole: RbacRole, userId: string) {
    await this.assertCanManageUser(actorId, actorRole, userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'active' },
    });

    await this.audit.record('user_unsuspended', actorId, userId);
    return { userId, status: 'active' };
  }

  async banUser(actorId: string, actorRole: RbacRole, input: unknown) {
    const parsed = banUserSchema.parse(input);
    await this.assertCanManageUser(actorId, actorRole, parsed.userId);

    const ban = await this.prisma.userBan.create({
      data: {
        userId: parsed.userId,
        type: parsed.type,
        reason: parsed.reason,
        bannedById: actorId,
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
      },
    });

    await this.prisma.user.update({
      where: { id: parsed.userId },
      data: { status: 'suspended' },
    });

    await this.audit.record('user_banned', actorId, parsed.userId, {
      banId: ban.id,
      type: parsed.type,
      reason: parsed.reason,
    });

    return this.mapBan(ban);
  }

  async unbanUser(actorId: string, actorRole: RbacRole, userId: string, banId: string) {
    await this.assertCanManageUser(actorId, actorRole, userId);

    const ban = await this.prisma.userBan.findFirst({
      where: { id: banId, userId, liftedAt: null },
    });
    if (!ban) throw new NotFoundException('Active ban not found');

    await this.prisma.userBan.update({
      where: { id: banId },
      data: { liftedAt: new Date() },
    });

    const activeBans = await this.prisma.userBan.count({
      where: { userId, liftedAt: null },
    });
    if (activeBans === 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { status: 'active' },
      });
    }

    await this.audit.record('user_unbanned', actorId, userId, { banId });
    return { userId, banId, lifted: true };
  }

  async updatePrimaryRole(
    actorId: string,
    actorRole: RbacRole,
    userId: string,
    roleId: string,
    role: RbacRole,
  ): Promise<User> {
    await this.assertCanManageUser(actorId, actorRole, userId);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { primaryRoleId: roleId },
      include: { primaryRole: true },
    });

    await this.audit.record('role_changed', actorId, userId, { role });
    return mapUser(updated);
  }

  private async assertCanManageUser(actorId: string, actorRole: RbacRole, targetUserId: string) {
    assertBootstrapSuperAdminImmutable(targetUserId);

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { primaryRole: true },
    });
    if (!target) throw new NotFoundException('User not found');

    const targetRole = target.primaryRole.code as RbacRole;

    if (actorRole === 'SUPER_ADMIN') return;

    if (targetRole === 'SUPER_ADMIN' || targetRole === 'ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN can manage admin accounts');
    }

    if (actorRole === 'ADMIN') {
      const allowed = await this.authorization.userHasAllPermissions(
        { id: actorId, role: actorRole, primaryRoleId: '' },
        ['manage_users'],
      );
      if (allowed) return;
    }

    throw new ForbiddenException('Insufficient permissions to manage this user');
  }

  private mapBan(ban: {
    id: string;
    userId: string;
    type: string;
    reason: string | null;
    bannedById: string | null;
    expiresAt: Date | null;
    liftedAt: Date | null;
    createdAt: Date;
  }): UserBan {
    return {
      id: ban.id,
      userId: ban.userId,
      type: ban.type as UserBan['type'],
      reason: ban.reason ?? undefined,
      bannedById: ban.bannedById ?? undefined,
      expiresAt: ban.expiresAt?.toISOString(),
      liftedAt: ban.liftedAt?.toISOString(),
      createdAt: ban.createdAt.toISOString(),
    };
  }
}
