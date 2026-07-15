import { forwardRef, Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { JobsModule } from '../../jobs/jobs.module';
import { LibsModule } from '../../libs/libs.module';
import { AuthModule } from '../auth/auth.module';
import { MonetizationModule } from '../monetization/monetization.module';
import { UsersModule } from '../users/users.module';
import { VerificationModule } from '../verification/verification.module';
import {
  SellerListingGateService,
  SellerVerificationStatusService,
} from './services/seller-listing-gate.service';
import { SellerStatusHistoryService } from './services/seller-status-history.service';
import { SellerVerificationService } from './services/seller-verification.service';
import { FastTrackSlaOverdueJobService } from './services/fast-track-sla-overdue.job';

@Module({
  imports: [
    DatabaseModule,
    EventsModule,
    JobsModule,
    LibsModule,
    AuthModule,
    UsersModule,
    VerificationModule,
    forwardRef(() => MonetizationModule),
  ],
  providers: [
    SellerStatusHistoryService,
    SellerListingGateService,
    SellerVerificationStatusService,
    SellerVerificationService,
    FastTrackSlaOverdueJobService,
  ],
  exports: [
    SellerStatusHistoryService,
    SellerListingGateService,
    SellerVerificationStatusService,
    SellerVerificationService,
    VerificationModule,
  ],
})
export class SellerVerificationModule {}
