import { Controller, Get, Post, Body } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  confirmGrowthPackSchema,
  createGrowthPackIntentSchema,
} from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AiMarketingAccessService } from '../ai-marketing/services/ai-marketing-access.service';
import { PlatformPurchaseService } from './services/platform-purchase.service';

@RequireRole('SELLER')
@Controller('seller/monetization/growth-pack')
export class SellerGrowthPackController {
  constructor(
    private readonly purchases: PlatformPurchaseService,
    private readonly aiMarketingAccess: AiMarketingAccessService,
  ) {}

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Get('catalog')
  async getCatalog(@CurrentUser() user: AuthenticatedUser) {
    await this.aiMarketingAccess.assertEffective();
    return this.purchases.getGrowthPackCatalog(user.id);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post('intent')
  async createIntent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    await this.aiMarketingAccess.assertEffective();
    createGrowthPackIntentSchema.parse(body ?? {});
    return this.purchases.createGrowthPackIntent(user.id);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post('confirm')
  async confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    await this.aiMarketingAccess.assertEffective();
    const dto = confirmGrowthPackSchema.parse(body);
    return this.purchases.confirmGrowthPack(user.id, dto);
  }
}
