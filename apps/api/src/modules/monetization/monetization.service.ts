import { Injectable } from '@nestjs/common';

import type { PlatformSettingsUpdateInput, SellerFeeOverrideInput } from '@community-marketplace/validation';

import { BuyerWalletService } from './services/buyer-wallet.service';
import { CashbackGrantsService } from './services/cashback-grants.service';
import { PlatformFeeService } from './services/platform-fee.service';
import { PlatformPurchaseService } from './services/platform-purchase.service';
import { PlatformSettingsService } from './services/platform-settings.service';

@Injectable()
export class MonetizationService {
  constructor(
    private readonly settings: PlatformSettingsService,
    private readonly fees: PlatformFeeService,
    private readonly grants: CashbackGrantsService,
    private readonly wallet: BuyerWalletService,
    private readonly purchases: PlatformPurchaseService,
  ) {}

  getPlatformSettings() {
    return this.settings.get();
  }

  updatePlatformSettings(input: PlatformSettingsUpdateInput) {
    return this.settings.update(input);
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
}
