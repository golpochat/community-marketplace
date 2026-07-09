import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { RbacRole, UserProfile } from '@community-marketplace/types';
import {
  completeProfileSchema,
  updateProfileSchema,
  type CompleteProfileInput,
  type UpdateProfileInput,
} from '@community-marketplace/validation';

import { EventBusService } from '../../../events/event-bus.service';
import { AuthorizationService } from '../../../common/authorization/authorization.service';
import { assertNoMarketplaceToOperatorPromotion } from '../../../common/constants/role-assignment.policy';
import { PrismaService } from '../../../database/prisma.service';
import { EmailIdentityService } from '../../auth/services/email-identity.service';
import { mapUserProfile, userProfileInclude } from '../mappers/user.mapper';
import { UserAuditService } from './user-audit.service';

@Injectable()
export class UsersProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: UserAuditService,
    private readonly authorization: AuthorizationService,
    private readonly eventBus: EventBusService,
    private readonly emailIdentity: EmailIdentityService,
  ) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.findUserOrThrow(userId);
    return mapUserProfile(user);
  }

  async updateProfile(
    actorId: string,
    actorRole: RbacRole,
    targetUserId: string,
    input: UpdateProfileInput,
  ): Promise<UserProfile> {
    await this.assertCanModifyProfile(actorId, actorRole, targetUserId);
    const parsed = updateProfileSchema.parse(input);

    if (parsed.email) {
      const existing = await this.emailIdentity.findUserByEmail(parsed.email);
      this.emailIdentity.assertProfileEmailAvailable(parsed.email, existing, targetUserId);
    }

    if (parsed.phone) {
      const user = await this.findUserOrThrow(targetUserId);
      const currentPhone = user.profile?.phone ?? null;
      if (parsed.phone !== currentPhone) {
        throw new BadRequestException(
          'Use the phone change flow to update your phone number.',
        );
      }
    }

    const profileData: Prisma.UserProfileUpdateInput = {
      ...(parsed.bio !== undefined ? { bio: parsed.bio } : {}),
      ...(parsed.address !== undefined ? { address: parsed.address } : {}),
      ...(parsed.dateOfBirth !== undefined
        ? { dateOfBirth: new Date(parsed.dateOfBirth) }
        : {}),
      ...(parsed.gender !== undefined ? { gender: parsed.gender } : {}),
      ...(parsed.location?.label !== undefined ? { location: parsed.location.label } : {}),
      ...(parsed.location?.latitude !== undefined
        ? { latitude: parsed.location.latitude }
        : {}),
      ...(parsed.location?.longitude !== undefined
        ? { longitude: parsed.location.longitude }
        : {}),
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          ...(parsed.displayName !== undefined ? { displayName: parsed.displayName } : {}),
          ...(parsed.email !== undefined ? { email: parsed.email } : {}),
          ...(parsed.avatarUrl !== undefined ? { avatarUrl: parsed.avatarUrl } : {}),
        },
      });

      const existingProfile = await tx.userProfile.findUnique({ where: { userId: targetUserId } });
      if (existingProfile) {
        await tx.userProfile.update({ where: { userId: targetUserId }, data: profileData });
      } else if (Object.keys(profileData).length > 0) {
        await tx.userProfile.create({
          data: {
            userId: targetUserId,
            ...this.unwrapProfileCreate(profileData),
          },
        });
      }
    });

    await this.audit.record('profile_update', actorId, targetUserId, { fields: Object.keys(parsed) });
    this.eventBus.publish({
      type: 'user.profile_updated',
      payload: { userId: targetUserId },
      timestamp: new Date(),
    });
    return this.getProfile(targetUserId);
  }

  async completeProfile(
    userId: string,
    actorRole: RbacRole,
    input: CompleteProfileInput,
  ): Promise<UserProfile> {
    const parsed = completeProfileSchema.parse(input);
    await this.updateProfile(userId, actorRole, userId, parsed);

    await this.prisma.user.update({
      where: { id: userId },
      data: { profileCompleted: true },
    });

    await this.audit.record('profile_completed', userId, userId);
    return this.getProfile(userId);
  }

  async setAvatarUrl(actorId: string, userId: string, avatarUrl: string): Promise<UserProfile> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    await this.audit.record('avatar_uploaded', actorId, userId, { avatarUrl });
    return this.getProfile(userId);
  }

  async setStoreBannerUrl(
    actorId: string,
    userId: string,
    storeBannerUrl: string,
  ): Promise<UserProfile> {
    await this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, storeBannerUrl },
      update: { storeBannerUrl },
    });
    await this.audit.record('store_banner_uploaded', actorId, userId, { storeBannerUrl });
    return this.getProfile(userId);
  }

  private async assertCanModifyProfile(
    actorId: string,
    actorRole: RbacRole,
    targetUserId: string,
  ) {
    if (actorId === targetUserId) return;

    if (actorRole === 'SUPER_ADMIN') return;

    if (actorRole === 'ADMIN') {
      const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
      if (!actor) throw new ForbiddenException('Actor not found');
      const allowed = await this.authorization.userHasAllPermissions(
        { id: actorId, role: actorRole, primaryRoleId: actor.primaryRoleId },
        ['manage_users'],
      );
      if (allowed) return;
    }

    throw new ForbiddenException('You can only update your own profile');
  }

  private async findUserOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: userProfileInclude,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private unwrapProfileCreate(
    data: Prisma.UserProfileUpdateInput,
  ): Prisma.UserProfileCreateWithoutUserInput {
    return data as Prisma.UserProfileCreateWithoutUserInput;
  }
}
