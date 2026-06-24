import { Body, Controller, Get, Patch, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto, VerifyEmailDto, VerifyIdentityDto } from '../users/dto/users.dto';
import { UsersService } from '../users/users.service';

@RequireRole('SELLER')
@Controller('seller/profile')
export class SellerProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch()
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.SUBMIT_VERIFICATION)
  @Post('verification/identity')
  requestIdentityVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyIdentityDto,
  ) {
    return this.usersService.requestIdentityVerification(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.SUBMIT_VERIFICATION)
  @Post('verification/email')
  verifyEmail(@CurrentUser() user: AuthenticatedUser, @Body() dto: VerifyEmailDto) {
    return this.usersService.verifyEmail(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.SUBMIT_VERIFICATION)
  @Get('verification')
  getVerifications(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getVerifications(user.id);
  }
}
