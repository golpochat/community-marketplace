import { Controller, Get, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import { cashbackEstimateQuerySchema } from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { MonetizationService } from './monetization.service';

@RequireRole('BUYER', 'SELLER')
@Controller('buyer/wallet')
export class BuyerWalletController {
  constructor(private readonly monetization: MonetizationService) {}

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get()
  getWallet(@CurrentUser() user: AuthenticatedUser) {
    return this.monetization.getBuyerWallet(user.id);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get('cashback-estimate')
  estimateCashback(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: Record<string, string>,
  ) {
    const { listingId } = cashbackEstimateQuerySchema.parse(query);
    return this.monetization.estimateCashback(user.id, listingId);
  }
}
