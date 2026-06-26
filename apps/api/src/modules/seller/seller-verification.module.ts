import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import {
  SellerListingGateService,
  SellerVerificationStatusService,
} from './services/seller-listing-gate.service';
import { SellerVerificationService } from './services/seller-verification.service';

@Module({
  imports: [DatabaseModule, EventsModule, AuthModule, UsersModule],
  providers: [
    SellerListingGateService,
    SellerVerificationStatusService,
    SellerVerificationService,
  ],
  exports: [
    SellerListingGateService,
    SellerVerificationStatusService,
    SellerVerificationService,
  ],
})
export class SellerVerificationModule {}
