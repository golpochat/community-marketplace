import { Body, Controller, Get, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SellerCapabilityService } from './services/seller-capability.service';
import { SellerOnboardingService } from './services/seller-onboarding.service';
import { StartSellerOnboardingDto } from './dto/seller-onboarding.dto';

@RequireRole('MEMBER', 'BUYER', 'SELLER')
@Controller('seller/onboarding')
export class SellerOnboardingController {
  constructor(
    private readonly onboarding: SellerOnboardingService,
    private readonly sellerCapability: SellerCapabilityService,
  ) {}

  @Get('status')
  @RequirePermissions(PERMISSIONS.VIEW_LISTINGS)
  status(@CurrentUser() user: AuthenticatedUser) {
    return this.sellerCapability.getOnboardingStatus(user.id);
  }

  @Post('start')
  @RequirePermissions(PERMISSIONS.VIEW_LISTINGS)
  start(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartSellerOnboardingDto) {
    return this.onboarding.startSelling(user.id, dto.sellerKind);
  }
}
