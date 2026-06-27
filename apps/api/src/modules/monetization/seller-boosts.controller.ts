import { Controller, Get, Post, Body, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  confirmBoostSchema,
  createBoostIntentSchema,
} from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { BoostCatalogService } from './services/boost-catalog.service';
import { PlatformPurchaseService } from './services/platform-purchase.service';

@RequireRole('SELLER')
@Controller('seller/monetization/boosts')
export class SellerBoostsController {
  constructor(
    private readonly catalog: BoostCatalogService,
    private readonly purchases: PlatformPurchaseService,
  ) {}

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Get('catalog')
  getCatalog(
    @CurrentUser() user: AuthenticatedUser,
    @Query('listingId') listingId?: string,
  ) {
    return this.catalog.getCatalog(user.id, listingId);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post('intent')
  createIntent(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = createBoostIntentSchema.parse(body);
    return this.purchases.createBoostIntent(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post('confirm')
  confirm(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = confirmBoostSchema.parse(body);
    return this.purchases.confirmBoost(user.id, dto);
  }
}
