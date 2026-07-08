import { Body, Controller, Get, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SellerVerificationService } from './services/seller-verification.service';

@RequireRole('SELLER')
@Controller('seller/verification')
export class SellerVerificationController {
  constructor(private readonly verificationService: SellerVerificationService) {}

  @Get('status')
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.verificationService.getStatus(user.id);
  }

  @RequirePermissions(PERMISSIONS.SUBMIT_VERIFICATION)
  @Post('start')
  start(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.verificationService.start(user.id, body);
  }

  @RequirePermissions(PERMISSIONS.SUBMIT_VERIFICATION)
  @Post('phone')
  verifyPhone(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.verificationService.verifyPhone(user.id, body);
  }

  @RequirePermissions(PERMISSIONS.SUBMIT_VERIFICATION)
  @Post('upload-id')
  uploadId(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.verificationService.uploadIdDocument(user.id, body);
  }

  @RequirePermissions(PERMISSIONS.SUBMIT_VERIFICATION)
  @Post('upload-selfie')
  uploadSelfie(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.verificationService.uploadSelfie(user.id, body);
  }

  @RequirePermissions(PERMISSIONS.SUBMIT_VERIFICATION)
  @Post('upload-address')
  uploadAddress(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.verificationService.uploadAddressDocument(user.id, body);
  }

  @RequirePermissions(PERMISSIONS.SUBMIT_VERIFICATION)
  @Post('personal-details')
  savePersonalDetails(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.verificationService.savePersonalDetails(user.id, body);
  }

  @RequirePermissions(PERMISSIONS.SUBMIT_VERIFICATION)
  @Post('submit')
  submit(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.verificationService.submit(user.id, body);
  }
}
