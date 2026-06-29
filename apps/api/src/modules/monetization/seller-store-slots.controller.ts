import { Controller, Get, Post, Body } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  confirmStoreSlotSchema,
  createStoreSlotIntentSchema,
} from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PlatformPurchaseService } from './services/platform-purchase.service';

@RequireRole('SELLER')
@Controller('seller/monetization/store-slots')
export class SellerStoreSlotsController {
  constructor(private readonly purchases: PlatformPurchaseService) {}

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Get('catalog')
  getCatalog(@CurrentUser() user: AuthenticatedUser) {
    return this.purchases.getStoreSlotCatalog(user.id);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post('intent')
  createIntent(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = createStoreSlotIntentSchema.parse(body);
    return this.purchases.createStoreSlotIntent(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post('confirm')
  confirm(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = confirmStoreSlotSchema.parse(body);
    return this.purchases.confirmStoreSlot(user.id, dto);
  }
}
