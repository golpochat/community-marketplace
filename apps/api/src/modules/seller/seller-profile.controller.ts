import { Body, Controller, Get, Patch, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import { verificationDocumentUploadRequestSchema } from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SellerVerificationDto, UpdateProfileDto } from '../users/dto/users.dto';
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
    return this.usersService.updateProfile(user.id, user.role, user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.SUBMIT_VERIFICATION)
  @Post('verification/upload-url')
  createVerificationUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const parsed = verificationDocumentUploadRequestSchema.parse(body);
    return this.usersService.createVerificationDocumentUploadUrl(user.id, parsed);
  }

  @RequirePermissions(PERMISSIONS.SUBMIT_VERIFICATION)
  @Post('verification')
  submitVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SellerVerificationDto,
  ) {
    return this.usersService.submitSellerVerification(user.id, dto);
  }

  @Get('verification')
  getVerificationStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getVerificationStatus(user.id);
  }
}
