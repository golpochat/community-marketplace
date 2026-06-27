import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { AuthModule } from '../auth/auth.module';
import { MonetizationModule } from '../monetization/monetization.module';
import { UsersModule } from '../users/users.module';
import {
  SellerListingGateService,
  SellerVerificationStatusService,
} from './services/seller-listing-gate.service';
import { SellerStatusHistoryService } from './services/seller-status-history.service';
import { SellerVerificationService } from './services/seller-verification.service';

@Module({
  imports: [DatabaseModule, EventsModule, AuthModule, UsersModule, MonetizationModule],
  providers: [
    SellerStatusHistoryService,
    SellerListingGateService,
    SellerVerificationStatusService,
    SellerVerificationService,
  ],
  exports: [
    SellerStatusHistoryService,
    SellerListingGateService,
    SellerVerificationStatusService,
    SellerVerificationService,
  ],
})
export class SellerVerificationModule {}
