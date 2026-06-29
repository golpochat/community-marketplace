import { Injectable, NotFoundException } from '@nestjs/common';

import type { RbacRole, User, UserEffectivePermissions } from '@community-marketplace/types';
import { paginationSchema } from '@community-marketplace/validation';

import { AuthorizationService } from '../../common/authorization/authorization.service';
import { PrismaService } from '../../database/prisma.service';
import { ApiUtilsService } from '../../utils/api-utils.service';
import { mapUser, userProfileInclude } from './mappers/user.mapper';
import { R2StorageService } from './services/r2-storage.service';
import { UserAuditService } from './services/user-audit.service';
import { UsersAdminService } from './services/users-admin.service';
import { UsersPhoneService } from './services/users-phone.service';
import { UsersProfileService } from './services/users-profile.service';
import { UsersSettingsService } from './services/users-settings.service';
import { UsersVerificationService } from './services/users-verification.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiUtils: ApiUtilsService,
    private readonly profileService: UsersProfileService,
    private readonly phoneService: UsersPhoneService,
    private readonly settingsService: UsersSettingsService,
    private readonly verificationService: UsersVerificationService,
    private readonly adminService: UsersAdminService,
    private readonly storageService: R2StorageService,
    private readonly auditService: UserAuditService,
    private readonly authorization: AuthorizationService,
  ) {}

  findAll(page = 1, limit = 20) {
    const { page: p, limit: l } = paginationSchema.parse({ page, limit });
    return this.adminService.listUsers({ page: p, limit: l }, 'SUPER_ADMIN');
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { primaryRole: true },
    });
    return user ? mapUser(user) : null;
  }

  getProfile(userId: string) {
    return this.profileService.getProfile(userId);
  }

  updateProfile(actorId: string, actorRole: RbacRole, targetUserId: string, dto: unknown) {
    return this.profileService.updateProfile(actorId, actorRole, targetUserId, dto as never);
  }

  completeProfile(userId: string, actorRole: RbacRole, dto: unknown) {
    return this.profileService.completeProfile(userId, actorRole, dto as never);
  }

  getSettings(userId: string) {
    return this.settingsService.getSettings(userId);
  }

  updateSettings(userId: string, dto: unknown) {
    return this.settingsService.updateSettings(userId, dto as never);
  }

  requestDeletion(userId: string) {
    return this.settingsService.requestDeletion(userId);
  }

  async createAvatarUploadUrl(userId: string, dto: unknown) {
    const parsed = dto as { contentType: string; fileName?: string };
    return this.storageService.createAvatarUploadUrl(
      userId,
      parsed.contentType,
      parsed.fileName,
    );
  }

  async createStoreBannerUploadUrl(userId: string, dto: unknown) {
    const parsed = dto as { contentType: string; fileName?: string };
    return this.storageService.createStoreBannerUploadUrl(
      userId,
      parsed.contentType,
      parsed.fileName,
    );
  }

  async createVerificationDocumentUploadUrl(userId: string, dto: unknown) {
    const parsed = dto as { contentType: string; fileName?: string };
    return this.storageService.createVerificationDocumentUploadUrl(
      userId,
      parsed.contentType,
      parsed.fileName,
    );
  }

  async confirmAvatar(actorId: string, userId: string, publicUrl: string) {
    return this.profileService.setAvatarUrl(actorId, userId, publicUrl);
  }

  async confirmStoreBanner(actorId: string, userId: string, publicUrl: string) {
    return this.profileService.setStoreBannerUrl(actorId, userId, publicUrl);
  }

  sendPhoneChangeOtp(userId: string, dto: unknown) {
    return this.phoneService.sendChangeOtp(userId, dto);
  }

  async confirmPhoneChange(userId: string, dto: unknown) {
    await this.phoneService.confirmChange(userId, dto);
    return this.getProfile(userId);
  }

  submitSellerVerification(userId: string, dto: unknown) {
    return this.verificationService.submitSellerVerification(userId, dto);
  }

  getVerificationStatus(userId: string) {
    return this.verificationService.getLatestForUser(userId);
  }

  async getEffectivePermissions(
    user: { id: string; role: RbacRole; primaryRoleId: string },
  ): Promise<UserEffectivePermissions> {
    return this.authorization.resolveForUser(user);
  }

  // Admin delegation
  listUsers(query: unknown, actorRole: RbacRole) {
    return this.adminService.listUsers(query, actorRole);
  }

  getUserDetails(userId: string, actorRole: RbacRole) {
    return this.adminService.getUserDetails(userId, actorRole);
  }

  suspendUser(actorId: string, actorRole: RbacRole, dto: unknown) {
    return this.adminService.suspendUser(actorId, actorRole, dto);
  }

  unsuspendUser(actorId: string, actorRole: RbacRole, userId: string) {
    return this.adminService.unsuspendUser(actorId, actorRole, userId);
  }

  banUser(actorId: string, actorRole: RbacRole, dto: unknown) {
    return this.adminService.banUser(actorId, actorRole, dto);
  }

  unbanUser(actorId: string, actorRole: RbacRole, userId: string, banId: string) {
    return this.adminService.unbanUser(actorId, actorRole, userId, banId);
  }

  listPendingVerifications(page?: number, limit?: number) {
    return this.verificationService.listPending(page, limit);
  }

  approveVerification(verificationId: string, reviewerId: string, dto?: unknown) {
    return this.verificationService.approve(verificationId, reviewerId, dto);
  }

  rejectVerification(verificationId: string, reviewerId: string, dto?: unknown) {
    return this.verificationService.reject(verificationId, reviewerId, dto);
  }

  getAuditLogs(query: unknown) {
    return this.auditService.listForAdmin(query as never);
  }

  async updatePrimaryRole(
    actorId: string,
    actorRole: RbacRole,
    userId: string,
    roleId: string,
    role: RbacRole,
  ) {
    return this.adminService.updatePrimaryRole(actorId, actorRole, userId, roleId, role);
  }

  async findUserOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: userProfileInclude,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
