import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  cashbackEstimateQuerySchema,
  confirmEarlyCashbackUnlockSchema,
  createEarlyCashbackUnlockIntentSchema,
} from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { MonetizationService } from './monetization.service';
import { PlatformPurchaseService } from './services/platform-purchase.service';

@RequireRole('BUYER', 'SELLER')
@Controller('buyer/wallet')
export class BuyerWalletController {
  constructor(
    private readonly monetization: MonetizationService,
    private readonly purchases: PlatformPurchaseService,
  ) {}

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

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Post('early-unlock/intent')
  createEarlyUnlockIntent(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = createEarlyCashbackUnlockIntentSchema.parse(body);
    return this.purchases.createEarlyCashbackUnlockIntent(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Post('early-unlock/confirm')
  confirmEarlyUnlock(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = confirmEarlyCashbackUnlockSchema.parse(body);
    return this.purchases.confirmEarlyCashbackUnlock(user.id, dto);
  }
}
