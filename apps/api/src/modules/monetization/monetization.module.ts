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
import { SellerFastTrackController } from './seller-fast-track.controller';
import { SellerStoreSlotsController } from './seller-store-slots.controller';
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
import { FastTrackFulfillmentService } from './services/fast-track-fulfillment.service';
import { BuyerWalletService } from './services/buyer-wallet.service';
import { BuyerCashbackService } from './services/buyer-cashback.service';
import { CashbackGrantsService } from './services/cashback-grants.service';
import { CashbackJobsService } from './services/cashback-jobs.service';
import { MonetizationProductService } from './services/monetization-product.service';
import { PlatformFeeService } from './services/platform-fee.service';
import { PlatformPurchaseService } from './services/platform-purchase.service';
import { PlatformPurchaseReceiptService } from './services/platform-purchase-receipt.service';
import { PlatformSettingsService } from './services/platform-settings.service';
import { AdsSystemService } from './services/ads-system.service';
import { DisplayAdsService } from './services/display-ads.service';
import { StoreSlotCatalogService } from './services/store-slot-catalog.service';
import { StoreSlotFulfillmentService } from './services/store-slot-fulfillment.service';
import { StatementsModule } from '../statements/statements.module';

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
  ],
  controllers: [
    AdminMonetizationController,
    PublicAdsController,
    BuyerWalletController,
    SellerBoostsController,
    SellerFeaturedController,
    SellerFastTrackController,
    SellerStoreSlotsController,
    SellerMonetizationPurchasesController,
  ],
  providers: [
    MonetizationService,
    PlatformSettingsService,
    AdsSystemService,
    DisplayAdsService,
    MonetizationProductService,
    BuyerCashbackService,
    PlatformFeeService,
    CashbackGrantsService,
    BuyerWalletService,
    CashbackJobsService,
    CashbackEventsListener,
    BoostCatalogService,
    BoostFulfillmentService,
    FeaturedCatalogService,
    FeaturedFulfillmentService,
    FeaturedExpiryJobService,
    FastTrackFulfillmentService,
    StoreSlotCatalogService,
    StoreSlotFulfillmentService,
    PlatformPurchaseService,
    PlatformPurchaseReceiptService,
    BoostExpiryJobService,
    VerificationFeeListener,
  ],
  exports: [
    PlatformFeeService,
    PlatformSettingsService,
    AdsSystemService,
    MonetizationService,
    PlatformPurchaseService,
    FastTrackFulfillmentService,
  ],
})
export class MonetizationModule {}
