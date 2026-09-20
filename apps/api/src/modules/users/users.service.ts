import { Injectable, NotFoundException } from '@nestjs/common';

import type { RbacRole, User, UserEffectivePermissions } from '@community-marketplace/types';

import { AuthorizationService } from '../../common/authorization/authorization.service';
import { UserRepository } from '../../database/repositories/user.repository';
import { ApiUtilsService } from '../../utils/api-utils.service';
import { mapUser } from './mappers/user.mapper';
import { R2StorageService } from './services/r2-storage.service';
import { UserAuditService } from './services/user-audit.service';
import { UsersAdminService } from './services/users-admin.service';
import { UsersPhoneService } from './services/users-phone.service';
import { UsersPrivacyService } from './services/users-privacy.service';
import { UsersProfileService } from './services/users-profile.service';
import { UsersSettingsService } from './services/users-settings.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UserRepository,
    private readonly apiUtils: ApiUtilsService,
    private readonly profileService: UsersProfileService,
    private readonly phoneService: UsersPhoneService,
    private readonly settingsService: UsersSettingsService,
    private readonly privacyService: UsersPrivacyService,
    private readonly adminService: UsersAdminService,
    private readonly storageService: R2StorageService,
    private readonly auditService: UserAuditService,
    private readonly authorization: AuthorizationService,
  ) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.users.findByIdWithRole(id);
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

  exportAccount(userId: string) {
    return this.privacyService.exportAccount(userId);
  }

  requestDeletion(userId: string) {
    return this.privacyService.requestDeletion(userId);
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

  updateMarketplaceUserStatus(
    actorId: string,
    actorRole: RbacRole,
    userId: string,
    dto: unknown,
  ) {
    return this.adminService.updateMarketplaceUserStatus(actorId, actorRole, userId, dto);
  }

  banUser(actorId: string, actorRole: RbacRole, dto: unknown) {
    return this.adminService.banUser(actorId, actorRole, dto);
  }

  unbanUser(actorId: string, actorRole: RbacRole, userId: string, banId: string) {
    return this.adminService.unbanUser(actorId, actorRole, userId, banId);
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
    const user = await this.users.findByIdWithProfile(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
