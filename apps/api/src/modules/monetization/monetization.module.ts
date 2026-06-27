import { forwardRef, Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { JobsModule } from '../../jobs/jobs.module';
import { LibsModule } from '../../libs/libs.module';
import { PaymentsModule } from '../payments/payments.module';
import { SearchModule } from '../search/search.module';
import { AdminMonetizationController } from './admin-monetization.controller';
import { BuyerWalletController } from './buyer-wallet.controller';
import { SellerBoostsController } from './seller-boosts.controller';
import { CashbackEventsListener } from './listeners/cashback-events.listener';
import { VerificationFeeListener } from './listeners/verification-fee.listener';
import { MonetizationService } from './monetization.service';
import { BoostCatalogService } from './services/boost-catalog.service';
import { BoostExpiryJobService } from './services/boost-expiry.job';
import { BoostFulfillmentService } from './services/boost-fulfillment.service';
import { BuyerWalletService } from './services/buyer-wallet.service';
import { CashbackGrantsService } from './services/cashback-grants.service';
import { CashbackJobsService } from './services/cashback-jobs.service';
import { PlatformFeeService } from './services/platform-fee.service';
import { PlatformPurchaseService } from './services/platform-purchase.service';
import { PlatformSettingsService } from './services/platform-settings.service';

@Module({
  imports: [
    DatabaseModule,
    EventsModule,
    JobsModule,
    LibsModule,
    SearchModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [
    AdminMonetizationController,
    BuyerWalletController,
    SellerBoostsController,
  ],
  providers: [
    MonetizationService,
    PlatformSettingsService,
    PlatformFeeService,
    CashbackGrantsService,
    BuyerWalletService,
    CashbackJobsService,
    CashbackEventsListener,
    BoostCatalogService,
    BoostFulfillmentService,
    PlatformPurchaseService,
    BoostExpiryJobService,
    VerificationFeeListener,
  ],
  exports: [
    PlatformFeeService,
    PlatformSettingsService,
    MonetizationService,
    PlatformPurchaseService,
  ],
})
export class MonetizationModule {}
