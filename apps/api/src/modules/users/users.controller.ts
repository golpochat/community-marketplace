import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  avatarUploadRequestSchema,
  confirmAvatarSchema,
  completeProfileSchema,
  updateProfileSchema,
  updateUserSettingsSchema,
} from '@community-marketplace/validation';

import { AuthorizationService } from '../../common/authorization/authorization.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authorization: AuthorizationService,
  ) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    updateProfileSchema.parse(body);
    return this.usersService.updateProfile(user.id, user.role, user.id, body);
  }

  @Post('me/profile/complete')
  completeProfile(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    completeProfileSchema.parse(body);
    return this.usersService.completeProfile(user.id, user.role, body);
  }

  @Post('me/avatar/upload-url')
  createAvatarUploadUrl(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const parsed = avatarUploadRequestSchema.parse(body);
    return this.usersService.createAvatarUploadUrl(user.id, parsed);
  }

  @Patch('me/avatar')
  confirmAvatar(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const parsed = confirmAvatarSchema.parse(body);
    return this.usersService.confirmAvatar(user.id, user.id, parsed.publicUrl);
  }

  @Post('me/store-banner/upload-url')
  createStoreBannerUploadUrl(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const parsed = avatarUploadRequestSchema.parse(body);
    return this.usersService.createStoreBannerUploadUrl(user.id, parsed);
  }

  @Patch('me/store-banner')
  confirmStoreBanner(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const parsed = confirmAvatarSchema.parse(body);
    return this.usersService.confirmStoreBanner(user.id, user.id, parsed.publicUrl);
  }

  @Post('me/phone/send-otp')
  sendPhoneChangeOtp(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.usersService.sendPhoneChangeOtp(user.id, body);
  }

  @Post('me/phone/verify')
  confirmPhoneChange(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.usersService.confirmPhoneChange(user.id, body);
  }

  @Get('me/permissions')
  getMyPermissions(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getEffectivePermissions(user);
  }

  @Get('me/settings')
  getMySettings(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getSettings(user.id);
  }

  @Patch('me/settings')
  updateMySettings(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    updateUserSettingsSchema.parse(body);
    return this.usersService.updateSettings(user.id, body);
  }

  @Post('me/settings/delete-request')
  requestDeletion(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.requestDeletion(user.id);
  }

  @RequireRole('ADMIN', 'SUPER_ADMIN')
  @RequirePermissions(PERMISSIONS.VIEW_USERS)
  @Get(':id/permissions')
  async getUserPermissions(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const target = await this.usersService.findUserOrThrow(id);
    return this.authorization.resolveForUser({
      id: target.id,
      role: target.primaryRole.code as AuthenticatedUser['role'],
      primaryRoleId: target.primaryRoleId,
    });
  }

  @Public()
  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.usersService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
