import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  getPanelLoginRedirectPath,
  type AdminInvitationAcceptResponse,
  type AdminInvitationPreviewResponse,
  type LoginResponse,
  type RbacRole,
  type User,
} from '@community-marketplace/types';
import { isInviteableRoleCode } from '@community-marketplace/config';
import { normalizeEmail } from '@community-marketplace/validation';

import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { hashPassword } from '../../database/seeds/password-hash';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthService } from '../auth/services/jwt-auth.service';
import { EmailIdentityService } from '../auth/services/email-identity.service';
import { SessionService } from '../auth/services/session.service';
import { PlatformGovernanceService } from '../platform/platform-governance.service';
import { generateSecureToken, generateSessionId, hashToken } from '../auth/utils/token-hash';
import { AdminInvitationEmailService } from './admin-invitation-email.service';
import {
  ADMIN_INVITATION_EXPIRY_DAYS,
  buildAdminInvitationUrl,
} from './templates/admin-invitation-email.template';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface AdminInvitationRow {
  id: string;
  email: string;
  displayName: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  expiresAt: string;
  createdAt: string;
}

@Injectable()
export class AdminInvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: AdminInvitationEmailService,
    private readonly emailIdentity: EmailIdentityService,
    private readonly governance: PlatformGovernanceService,
    private readonly jwtAuth: JwtAuthService,
    private readonly sessions: SessionService,
  ) {}

  async listInviteableRoles() {
    const roles = await this.prisma.role.findMany({
      where: { code: { notIn: ['SUPER_ADMIN', 'SELLER', 'BUYER'] } },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true, description: true, isSystem: true },
    });

    return roles.filter((role) => isInviteableRoleCode(role.code));
  }

  async listPendingInvitations(): Promise<AdminInvitationRow[]> {
    const now = new Date();
    const rows = await this.prisma.adminInvitation.findMany({
      where: {
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      include: {
        role: { select: { code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      roleId: row.roleId,
      roleCode: row.role.code,
      roleName: row.role.name,
      expiresAt: row.expiresAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createInvitation(
    actor: AuthenticatedUser,
    input: { email: string; displayName: string; roleId: string },
  ) {
    const email = normalizeEmail(input.email);
    const displayName = input.displayName.trim();

    const role = await this.prisma.role.findUnique({ where: { id: input.roleId } });
    if (!role || !isInviteableRoleCode(role.code)) {
      throw new BadRequestException('Selected role cannot be assigned via invitation');
    }

    await this.emailIdentity.assertAvailableForAdminInvitation(email);

    await this.prisma.adminInvitation.updateMany({
      where: {
        email,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + ADMIN_INVITATION_EXPIRY_DAYS * MS_PER_DAY);

    const invitation = await this.prisma.adminInvitation.create({
      data: {
        email,
        displayName,
        roleId: role.id,
        tokenHash,
        invitedById: actor.id,
        expiresAt,
      },
      include: { role: true },
    });

    const appBaseUrl = process.env.WEB_APP_URL ?? 'http://localhost:3000';
    const setupUrl = buildAdminInvitationUrl(appBaseUrl, rawToken);
    const supportEmail = await this.governance.getSupportEmail();

    await this.emailService.sendInvitationEmail({
      email,
      displayName,
      roleName: role.name,
      setupUrl,
      supportEmail,
      webAppUrl: appBaseUrl,
    });

    return {
      id: invitation.id,
      email: invitation.email,
      displayName: invitation.displayName,
      roleId: invitation.roleId,
      roleCode: invitation.role.code,
      roleName: invitation.role.name,
      expiresAt: invitation.expiresAt.toISOString(),
      setupUrl: process.env.NODE_ENV !== 'production' ? setupUrl : undefined,
    };
  }

  async resendInvitation(actor: AuthenticatedUser, invitationId: string) {
    const invitation = await this.findPendingInvitation(invitationId);

    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + ADMIN_INVITATION_EXPIRY_DAYS * MS_PER_DAY);

    const updated = await this.prisma.adminInvitation.update({
      where: { id: invitation.id },
      data: { tokenHash, expiresAt, invitedById: actor.id },
      include: { role: true },
    });

    const appBaseUrl = process.env.WEB_APP_URL ?? 'http://localhost:3000';
    const setupUrl = buildAdminInvitationUrl(appBaseUrl, rawToken);
    const supportEmail = await this.governance.getSupportEmail();

    await this.emailService.sendInvitationEmail({
      email: updated.email,
      displayName: updated.displayName,
      roleName: updated.role.name,
      setupUrl,
      supportEmail,
      webAppUrl: appBaseUrl,
    });

    return {
      id: updated.id,
      email: updated.email,
      expiresAt: updated.expiresAt.toISOString(),
      message: 'Invitation resent',
      setupUrl: process.env.NODE_ENV !== 'production' ? setupUrl : undefined,
    };
  }

  async revokeInvitation(invitationId: string) {
    const invitation = await this.findPendingInvitation(invitationId);

    await this.prisma.adminInvitation.update({
      where: { id: invitation.id },
      data: { revokedAt: new Date() },
    });

    return { id: invitation.id, revoked: true };
  }

  async previewInvitation(token: string): Promise<AdminInvitationPreviewResponse> {
    const invitation = await this.findInvitationByToken(token);
    const now = new Date();

    return {
      email: invitation.email,
      displayName: invitation.displayName,
      roleCode: invitation.role.code,
      roleName: invitation.role.name,
      expired: invitation.expiresAt < now || Boolean(invitation.revokedAt),
      alreadyAccepted: Boolean(invitation.acceptedAt),
    };
  }

  async acceptInvitation(
    token: string,
    password: string,
    context: { userAgent?: string; ipAddress?: string; deviceFingerprint?: string },
  ): Promise<AdminInvitationAcceptResponse> {
    const invitation = await this.findInvitationByToken(token);
    const now = new Date();

    if (invitation.revokedAt) {
      throw new ForbiddenException('This invitation has been revoked');
    }
    if (invitation.acceptedAt) {
      throw new ConflictException('This invitation has already been accepted');
    }
    if (invitation.expiresAt < now) {
      throw new ForbiddenException('This invitation has expired');
    }

    const role = invitation.role;
    if (!isInviteableRoleCode(role.code)) {
      throw new BadRequestException('Invalid invitation role');
    }

    await this.emailIdentity.assertInvitationAcceptanceAllowed(invitation.email);

    const passwordHash = hashPassword(password);
    const dbUser = await this.prisma.user.create({
      data: {
        email: invitation.email,
        displayName: invitation.displayName,
        passwordHash,
        primaryRoleId: role.id,
        status: 'active',
        emailVerifiedAt: now,
        emailVerified: true,
        profileCompleted: true,
      },
      include: { primaryRole: true },
    });

    await this.prisma.adminInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: now },
    });

    const user = this.toUserFromDb(dbUser);
    const login = await this.establishSession(user, context, role.code);

    return {
      email: user.email,
      userId: user.id,
      login,
    };
  }

  private async findPendingInvitation(invitationId: string) {
    const invitation = await this.prisma.adminInvitation.findUnique({
      where: { id: invitationId },
      include: { role: true },
    });

    if (!invitation || invitation.acceptedAt || invitation.revokedAt) {
      throw new NotFoundException('Pending invitation not found');
    }
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    return invitation;
  }

  private async findInvitationByToken(token: string) {
    const tokenHash = hashToken(token);
    const invitation = await this.prisma.adminInvitation.findUnique({
      where: { tokenHash },
      include: { role: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return invitation;
  }

  private toUserFromDb(dbUser: {
    id: string;
    email: string;
    displayName: string | null;
    primaryRoleId: string;
    status: string;
    emailVerifiedAt?: Date | null;
    phoneVerifiedAt?: Date | null;
    profileCompleted?: boolean;
    createdAt: Date;
    updatedAt: Date;
    primaryRole: { code: string };
  }): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      displayName: dbUser.displayName ?? undefined,
      primaryRoleId: dbUser.primaryRoleId,
      role: dbUser.primaryRole.code as RbacRole,
      status: dbUser.status as User['status'],
      emailVerified: Boolean(dbUser.emailVerifiedAt),
      phoneVerified: Boolean(dbUser.phoneVerifiedAt),
      profileCompleted: dbUser.profileCompleted ?? false,
      createdAt: dbUser.createdAt.toISOString(),
      updatedAt: dbUser.updatedAt.toISOString(),
    };
  }

  private async establishSession(
    user: User,
    context: { userAgent?: string; ipAddress?: string; deviceFingerprint?: string },
    roleCode: string,
  ): Promise<LoginResponse> {
    const sessionId = generateSessionId();
    const tokens = this.jwtAuth.issueTokenPair(user, sessionId);
    await this.sessions.createSession(user, tokens.refreshToken, context);
    const base = this.jwtAuth.toAuthResponse(user, tokens);
    return {
      ...base,
      redirectPath: getPanelLoginRedirectPath(roleCode),
    };
  }
}
