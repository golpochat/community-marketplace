import { Controller, Get, Post, Body, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  confirmFeaturedStoreSchema,
  createFeaturedStoreIntentSchema,
} from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { FeaturedStoreCatalogService } from './services/featured-store-catalog.service';
import { PlatformPurchaseService } from './services/platform-purchase.service';

@RequireRole('SELLER')
@Controller('seller/monetization/featured-store')
export class SellerFeaturedStoreController {
  constructor(
    private readonly catalog: FeaturedStoreCatalogService,
    private readonly purchases: PlatformPurchaseService,
  ) {}

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Get('catalog')
  getCatalog(
    @CurrentUser() user: AuthenticatedUser,
    @Query('storeId') storeId?: string,
  ) {
    const dto = createFeaturedStoreIntentSchema.parse({ storeId });
    return this.catalog.getCatalog(user.id, dto.storeId);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post('intent')
  createIntent(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = createFeaturedStoreIntentSchema.parse(body);
    return this.purchases.createFeaturedStoreIntent(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post('confirm')
  confirm(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = confirmFeaturedStoreSchema.parse(body);
    return this.purchases.confirmFeaturedStore(user.id, dto);
  }
}
