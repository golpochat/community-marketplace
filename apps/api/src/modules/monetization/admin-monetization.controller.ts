import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  buyerCashbackOverrideSchema,
  cashbackGrantsAdminFiltersSchema,
  monetizationProductUpdateSchema,
  monetizationProductUpsertSchema,
  monetizationSellerSearchSchema,
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
  @Get('ads-system')
  getAdsSystemStatus() {
    return this.monetization.getAdsSystemStatus();
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
  @Get('seller-fee-overrides')
  listSellerFeeOverrides() {
    return this.monetization.listSellerFeeOverrides();
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get('sellers/search')
  searchSellers(@Query() query: Record<string, string>) {
    const parsed = monetizationSellerSearchSchema.parse({
      q: query.q,
      limit: query.limit,
    });
    return this.monetization.searchSellersForMonetization(parsed.q, parsed.limit);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get('products')
  listProducts(@Query('type') type?: string) {
    const productType =
      type === 'listing_boost' || type === 'featured_slot' ? type : undefined;
    return this.monetization.listMonetizationProducts(productType);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Post('products')
  createProduct(@Body() body: unknown) {
    const dto = monetizationProductUpsertSchema.parse(body);
    return this.monetization.createMonetizationProduct(dto);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: unknown) {
    const dto = monetizationProductUpdateSchema.parse(body);
    return this.monetization.updateMonetizationProduct(id, dto);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Post('buyer-cashback-override')
  setBuyerCashbackOverride(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const dto = buyerCashbackOverrideSchema.parse(body);
    return this.monetization.setBuyerCashbackOverride(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get('buyer-cashback-overrides')
  listBuyerCashbackOverrides() {
    return this.monetization.listBuyerCashbackOverrides();
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get('buyers/search')
  searchBuyers(@Query() query: Record<string, string>) {
    const parsed = monetizationSellerSearchSchema.parse({
      q: query.q,
      limit: query.limit,
    });
    return this.monetization.searchBuyersForCashback(parsed.q, parsed.limit);
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
