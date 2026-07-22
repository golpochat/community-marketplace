import { Module, forwardRef } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { DevUploadModule } from '../dev-upload/dev-upload.module';
import { EventsModule } from '../../events/events.module';
import { JobsModule } from '../../jobs/jobs.module';
import { LibsModule } from '../../libs/libs.module';
import { PaymentsModule } from '../payments/payments.module';
import { SearchModule } from '../search/search.module';
import { UsersModule } from '../users/users.module';
import { AdminMonetizationController } from './admin-monetization.controller';
import { PublicAdsController } from './public-ads.controller';
import { BuyerWalletController } from './buyer-wallet.controller';
import { SellerBoostsController } from './seller-boosts.controller';
import { SellerFeaturedController } from './seller-featured.controller';
import { SellerFeaturedStoreController } from './seller-featured-store.controller';
import { SellerFastTrackController } from './seller-fast-track.controller';
import { SellerStoreSlotsController } from './seller-store-slots.controller';
import { SellerGrowthPackController } from './seller-growth-pack.controller';
import { SellerAiCreditPackController } from './seller-ai-credit-pack.controller';
import { SellerMonetizationPurchasesController } from './seller-monetization-purchases.controller';
import { CashbackEventsListener } from './listeners/cashback-events.listener';
import { VerificationFeeListener } from './listeners/verification-fee.listener';
import { MonetizationService } from './monetization.service';
import { BoostCatalogService } from './services/boost-catalog.service';
import { BoostExpiryJobService } from './services/boost-expiry.job';
import { BoostFulfillmentService } from './services/boost-fulfillment.service';
import { FeaturedCatalogService } from './services/featured-catalog.service';
import { FeaturedExpiryJobService } from './services/featured-expiry.job';
import { FeaturedFulfillmentService } from './services/featured-fulfillment.service';
import { FeaturedStoreCatalogService } from './services/featured-store-catalog.service';
import { FeaturedStoreFulfillmentService } from './services/featured-store-fulfillment.service';
import { FastTrackFulfillmentService } from './services/fast-track-fulfillment.service';
import { GrowthPackFulfillmentService } from './services/growth-pack-fulfillment.service';
import { MarketingHubAnalyticsService } from './services/marketing-hub-analytics.service';
import { BuyerWalletService } from './services/buyer-wallet.service';
import { WalletSpendService } from './services/wallet-spend.service';
import { BuyerCashbackService } from './services/buyer-cashback.service';
import { CashbackGrantsService } from './services/cashback-grants.service';
import { CashbackJobsService } from './services/cashback-jobs.service';
import { MonetizationProductService } from './services/monetization-product.service';
import { PlatformFeeService } from './services/platform-fee.service';
import { PlatformPurchaseService } from './services/platform-purchase.service';
import { PlatformPurchaseReceiptService } from './services/platform-purchase-receipt.service';
import { PlatformSettingsService } from './services/platform-settings.service';
import { AiMarketingQuotaService } from './services/ai-marketing-quota.service';
import { AdsSystemService } from './services/ads-system.service';
import { DisplayAdsService } from './services/display-ads.service';
import { DisplayAdCampaignService } from './services/display-ad-campaign.service';
import { StoreSlotCatalogService } from './services/store-slot-catalog.service';
import { StoreSlotFulfillmentService } from './services/store-slot-fulfillment.service';
import { StatementsModule } from '../statements/statements.module';
import { VerificationModule } from '../verification/verification.module';
import { AiMarketingModule } from '../ai-marketing/ai-marketing.module';

@Module({
  imports: [
    DatabaseModule,
    EventsModule,
    JobsModule,
    LibsModule,
    DevUploadModule,
    UsersModule,
    SearchModule,
    forwardRef(() => PaymentsModule),
    forwardRef(() => StatementsModule),
    forwardRef(() => AiMarketingModule),
    VerificationModule,
  ],
  controllers: [
    AdminMonetizationController,
    PublicAdsController,
    BuyerWalletController,
    SellerBoostsController,
    SellerFeaturedController,
    SellerFeaturedStoreController,
    SellerFastTrackController,
    SellerStoreSlotsController,
    SellerGrowthPackController,
    SellerAiCreditPackController,
    SellerMonetizationPurchasesController,
  ],
  providers: [
    MonetizationService,
    PlatformSettingsService,
    AiMarketingQuotaService,
    AdsSystemService,
    DisplayAdsService,
    DisplayAdCampaignService,
    MonetizationProductService,
    BuyerCashbackService,
    PlatformFeeService,
    CashbackGrantsService,
    BuyerWalletService,
    WalletSpendService,
    CashbackJobsService,
    CashbackEventsListener,
    BoostCatalogService,
    BoostFulfillmentService,
    FeaturedCatalogService,
    FeaturedFulfillmentService,
    FeaturedStoreCatalogService,
    FeaturedStoreFulfillmentService,
    FeaturedExpiryJobService,
    FastTrackFulfillmentService,
    StoreSlotCatalogService,
    StoreSlotFulfillmentService,
    GrowthPackFulfillmentService,
    MarketingHubAnalyticsService,
    PlatformPurchaseService,
    PlatformPurchaseReceiptService,
    BoostExpiryJobService,
    VerificationFeeListener,
  ],
  exports: [
    PlatformFeeService,
    PlatformSettingsService,
    AiMarketingQuotaService,
    AdsSystemService,
    MonetizationService,
    PlatformPurchaseService,
    FastTrackFulfillmentService,
  ],
})
export class MonetizationModule {}
