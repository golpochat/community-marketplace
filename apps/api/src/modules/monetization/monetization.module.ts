import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { JobsModule } from '../../jobs/jobs.module';
import { LibsModule } from '../../libs/libs.module';
import { AdminMonetizationController } from './admin-monetization.controller';
import { BuyerWalletController } from './buyer-wallet.controller';
import { CashbackEventsListener } from './listeners/cashback-events.listener';
import { MonetizationService } from './monetization.service';
import { BuyerWalletService } from './services/buyer-wallet.service';
import { CashbackGrantsService } from './services/cashback-grants.service';
import { CashbackJobsService } from './services/cashback-jobs.service';
import { PlatformFeeService } from './services/platform-fee.service';
import { PlatformSettingsService } from './services/platform-settings.service';

@Module({
  imports: [DatabaseModule, EventsModule, JobsModule, LibsModule],
  controllers: [
    AdminMonetizationController,
    BuyerWalletController,
  ],
  providers: [
    MonetizationService,
    PlatformSettingsService,
    PlatformFeeService,
    CashbackGrantsService,
    BuyerWalletService,
    CashbackJobsService,
    CashbackEventsListener,
  ],
  exports: [PlatformFeeService, PlatformSettingsService, MonetizationService],
})
export class MonetizationModule {}
