import { Injectable } from '@nestjs/common';



import type { PlatformSettingsUpdateInput, SellerFeeOverrideInput } from '@community-marketplace/validation';

import type {

  BuyerCashbackOverrideInput,

  MonetizationProductUpdateInput,

  MonetizationProductUpsertInput,

} from '@community-marketplace/validation';



import { BuyerWalletService } from './services/buyer-wallet.service';

import { BuyerCashbackService } from './services/buyer-cashback.service';

import { CashbackGrantsService } from './services/cashback-grants.service';

import { MonetizationProductService } from './services/monetization-product.service';

import { PlatformFeeService } from './services/platform-fee.service';

import { PlatformPurchaseService } from './services/platform-purchase.service';

import { PlatformSettingsService } from './services/platform-settings.service';

import { AdsSystemService } from './services/ads-system.service';

import { MarketingHubAnalyticsService } from './services/marketing-hub-analytics.service';



@Injectable()

export class MonetizationService {

  constructor(

    private readonly settings: PlatformSettingsService,

    private readonly adsSystem: AdsSystemService,

    private readonly fees: PlatformFeeService,

    private readonly grants: CashbackGrantsService,

    private readonly wallet: BuyerWalletService,

    private readonly purchases: PlatformPurchaseService,

    private readonly products: MonetizationProductService,

    private readonly buyerCashback: BuyerCashbackService,

    private readonly marketingHubAnalytics: MarketingHubAnalyticsService,

  ) {}



  getPlatformSettings() {

    return this.settings.get();

  }



  updatePlatformSettings(input: PlatformSettingsUpdateInput) {

    return this.settings.update(input);

  }



  getAdsSystemStatus() {

    return this.adsSystem.getStatus();

  }



  getSellerFeeInfo(sellerId: string) {

    return this.fees.getSellerFeeInfo(sellerId);

  }



  setSellerFeeOverride(adminId: string, input: SellerFeeOverrideInput) {

    return this.fees.setSellerFeeOverride(

      adminId,

      input.userId,

      input.customPlatformFeePercent,

      input.reason,

    );

  }



  listSellerFeeOverrides() {

    return this.fees.listSellerFeeOverrides();

  }



  searchSellersForMonetization(query: string, limit?: number) {

    return this.fees.searchSellers(query, limit);

  }



  listMonetizationProducts(type?: 'listing_boost' | 'featured_slot') {

    return this.products.listAdmin(type);

  }



  createMonetizationProduct(input: MonetizationProductUpsertInput) {

    return this.products.create(input);

  }



  updateMonetizationProduct(id: string, input: MonetizationProductUpdateInput) {

    return this.products.update(id, input);

  }



  setBuyerCashbackOverride(adminId: string, input: BuyerCashbackOverrideInput) {

    return this.buyerCashback.setBuyerCashbackOverride(

      adminId,

      input.userId,

      input.customCashbackPercent,

      input.reason,

    );

  }



  listBuyerCashbackOverrides() {

    return this.buyerCashback.listBuyerCashbackOverrides();

  }



  searchBuyersForCashback(query: string, limit?: number) {

    return this.buyerCashback.searchBuyers(query, limit);

  }



  getBuyerWallet(userId: string) {

    return this.wallet.getSummary(userId);

  }



  estimateCashback(buyerId: string, listingId: string) {

    return this.grants.estimateForListing(buyerId, listingId);

  }



  listCashbackGrants(filters: Parameters<CashbackGrantsService['listGrantsAdmin']>[0]) {

    return this.grants.listGrantsAdmin(filters);

  }



  listWalletTransactions(filters: Parameters<BuyerWalletService['listTransactionsAdmin']>[0]) {

    return this.wallet.listTransactionsAdmin(filters);

  }



  listPlatformPurchases(filters: Parameters<PlatformPurchaseService['listAdmin']>[0]) {

    return this.purchases.listAdmin(filters);

  }



  getMarketingHubAnalytics(

    filters: Parameters<MarketingHubAnalyticsService['getAnalytics']>[0],

  ) {

    return this.marketingHubAnalytics.getAnalytics(filters);

  }

}

