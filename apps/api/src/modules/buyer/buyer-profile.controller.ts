import { Body, Controller, Get, Patch, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateReportDto } from '../moderation/dto/moderation.dto';
import { ModerationService } from '../moderation/moderation.service';
import { UpdateProfileDto, VerifyEmailDto, VerifyIdentityDto } from '../users/dto/users.dto';
import { UsersService } from '../users/users.service';

@RequireRole('BUYER')
@Controller('buyer')
export class BuyerProfileController {
  constructor(
    private readonly usersService: UsersService,
    private readonly moderationService: ModerationService,
  ) {}

  @Get('profile')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.SUBMIT_VERIFICATION)
  @Post('profile/verification/identity')
  requestIdentityVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyIdentityDto,
  ) {
    return this.usersService.requestIdentityVerification(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.SUBMIT_VERIFICATION)
  @Post('profile/verification/email')
  verifyEmail(@CurrentUser() user: AuthenticatedUser, @Body() dto: VerifyEmailDto) {
    return this.usersService.verifyEmail(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.SUBMIT_VERIFICATION)
  @Get('profile/verification')
  getVerifications(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getVerifications(user.id);
  }

  @Post('reports')
  createReport(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReportDto) {
    return this.moderationService.createReport(user.id, dto);
  }
}
