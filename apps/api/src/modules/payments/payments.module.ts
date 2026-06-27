import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { ListingsModule } from '../listings/listings.module';
import { LibsModule } from '../../libs/libs.module';
import { MonetizationModule } from '../monetization/monetization.module';
import { PaymentsWebhooksController } from './payments-webhooks.controller';
import { PaymentsService } from './payments.service';
import { PaymentsAccessService } from './services/payments-access.service';
import { PaymentsAuditService } from './services/payments-audit.service';
import { PaymentsCrudService } from './services/payments-crud.service';
import { PaymentsDisputesService } from './services/payments-disputes.service';
import { PaymentsFraudService } from './services/payments-fraud.service';
import { PaymentsIntentsService } from './services/payments-intents.service';
import { PaymentsLedgerService } from './services/payments-ledger.service';
import { PaymentCompletionService } from './services/payment-completion.service';
import { PaymentsPayoutsService } from './services/payments-payouts.service';
import { PaymentsRefundsService } from './services/payments-refunds.service';
import { PaymentsWebhooksService } from './services/payments-webhooks.service';
import { StripeConnectService } from './services/stripe-connect.service';

@Module({
  imports: [DatabaseModule, EventsModule, LibsModule, ListingsModule, MonetizationModule],
  controllers: [PaymentsWebhooksController],
  providers: [
    PaymentsService,
    PaymentsCrudService,
    PaymentsAccessService,
    PaymentsAuditService,
    PaymentsLedgerService,
    PaymentsFraudService,
    PaymentsIntentsService,
    PaymentsRefundsService,
    PaymentsDisputesService,
    PaymentsPayoutsService,
    PaymentCompletionService,
    PaymentsWebhooksService,
    StripeConnectService,
  ],
  exports: [PaymentsService, StripeConnectService, PaymentsAccessService],
})
export class PaymentsModule {}
