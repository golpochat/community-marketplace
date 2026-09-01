import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  cashbackGrantsAdminFiltersSchema,
  platformPurchasesAdminFiltersSchema,
  platformSettingsUpdateSchema,
  sellerFeeOverrideSchema,
  walletTransactionsAdminFiltersSchema,
} from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { MonetizationService } from './monetization.service';

@RequireRole('ADMIN', 'SUPER_ADMIN')
@Controller('admin/monetization')
export class AdminMonetizationController {
  constructor(private readonly monetization: MonetizationService) {}

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get('settings')
  getSettings() {
    return this.monetization.getPlatformSettings();
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Patch('settings')
  updateSettings(@Body() body: unknown) {
    const dto = platformSettingsUpdateSchema.parse(body);
    return this.monetization.updatePlatformSettings(dto);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Post('seller-fee-override')
  setSellerFeeOverride(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const dto = sellerFeeOverrideSchema.parse(body);
    return this.monetization.setSellerFeeOverride(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get('platform-purchases')
  listPlatformPurchases(@Query() query: Record<string, string>) {
    const filters = platformPurchasesAdminFiltersSchema.parse({
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      type: query.type,
      status: query.status,
      userId: query.userId,
    });
    return this.monetization.listPlatformPurchases(filters);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get('cashback-grants')
  listGrants(@Query() query: Record<string, string>) {
    const filters = cashbackGrantsAdminFiltersSchema.parse({
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      status: query.status,
      userId: query.userId,
    });
    return this.monetization.listCashbackGrants(filters);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get('wallet-transactions')
  listWalletTransactions(@Query() query: Record<string, string>) {
    const filters = walletTransactionsAdminFiltersSchema.parse({
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      userId: query.userId,
      type: query.type,
    });
    return this.monetization.listWalletTransactions(filters);
  }
}
