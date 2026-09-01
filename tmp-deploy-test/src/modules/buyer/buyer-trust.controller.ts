import { Controller, Get, Param } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { BuyerTrustService } from './buyer-trust.service';

@RequireRole('BUYER')
@Controller('buyer/trust')
export class BuyerTrustController {
  constructor(private readonly buyerTrust: BuyerTrustService) {}

  @RequirePermissions(PERMISSIONS.VIEW_REVIEWS)
  @Get('me')
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.buyerTrust.getProfile(user.id);
  }

  @RequireRole('SELLER')
  @Get(':buyerId')
  getForSeller(
    @CurrentUser() user: AuthenticatedUser,
    @Param('buyerId') buyerId: string,
  ) {
    return this.buyerTrust.getProfileForSeller(user.id, buyerId, user.role);
  }
}
