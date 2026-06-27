import { Controller, Get, Post, Body, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  confirmFeaturedSchema,
  createFeaturedIntentSchema,
} from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { FeaturedCatalogService } from './services/featured-catalog.service';
import { PlatformPurchaseService } from './services/platform-purchase.service';

@RequireRole('SELLER')
@Controller('seller/monetization/featured')
export class SellerFeaturedController {
  constructor(
    private readonly catalog: FeaturedCatalogService,
    private readonly purchases: PlatformPurchaseService,
  ) {}

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Get('catalog')
  getCatalog(
    @CurrentUser() user: AuthenticatedUser,
    @Query('listingId') listingId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.catalog.getCatalog(user.id, listingId, categoryId);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post('intent')
  createIntent(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = createFeaturedIntentSchema.parse(body);
    return this.purchases.createFeaturedIntent(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post('confirm')
  confirm(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = confirmFeaturedSchema.parse(body);
    return this.purchases.confirmFeatured(user.id, dto);
  }
}
