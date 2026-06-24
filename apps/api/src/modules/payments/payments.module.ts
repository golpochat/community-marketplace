import { Module } from '@nestjs/common';

import { LibsModule } from '../../libs/libs.module';
import { PaymentsService } from './payments.service';
import { StripeConnectService } from './services/stripe-connect.service';

/** Payment mutations live under /seller/payments and /buyer/purchases */
@Module({
  imports: [LibsModule],
  providers: [PaymentsService, StripeConnectService],
  exports: [PaymentsService, StripeConnectService],
})
export class PaymentsModule {}
