import { forwardRef, Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { EmailModule } from '../../email/email.module';
import { EventsModule } from '../../events/events.module';
import { DevUploadModule } from '../dev-upload/dev-upload.module';
import { ListingsModule } from '../listings/listings.module';
import { LibsModule } from '../../libs/libs.module';
import { MonetizationModule } from '../monetization/monetization.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { PaymentNotificationsListener } from './listeners/payment-notifications.listener';
import { PaymentsWebhooksController } from './payments-webhooks.controller';
import { PaymentsService } from './payments.service';
import { PaymentsAccessService } from './services/payments-access.service';
import { PaymentsAuditService } from './services/payments-audit.service';
import { PaymentsCheckoutService } from './services/payments-checkout.service';
import { PaymentsCrudService } from './services/payments-crud.service';
import { PaymentsDisputesService } from './services/payments-disputes.service';
import { PaymentsFraudService } from './services/payments-fraud.service';
import { PaymentsIntentsService } from './services/payments-intents.service';
import { PaymentsLedgerService } from './services/payments-ledger.service';
import { PaymentCompletionService } from './services/payment-completion.service';
import { PaymentReceiptEmailService } from './services/payment-receipt-email.service';
import { PaymentReceiptService } from './services/payment-receipt.service';
import { PaymentsPayoutsService } from './services/payments-payouts.service';
import { PaymentsRefundsService } from './services/payments-refunds.service';
import { PaymentsSettlementService } from './services/payments-settlement.service';
import { PaymentsWebhooksService } from './services/payments-webhooks.service';
import { StripeConnectService } from './services/stripe-connect.service';

@Module({
  imports: [
    DatabaseModule,
    EmailModule,
    EventsModule,
    LibsModule,
    DevUploadModule,
    UsersModule,
    NotificationsModule,
    forwardRef(() => ListingsModule),
    forwardRef(() => MonetizationModule),
  ],
  controllers: [PaymentsWebhooksController],
  providers: [
    PaymentsService,
    PaymentsCrudService,
    PaymentsAccessService,
    PaymentsAuditService,
    PaymentsLedgerService,
    PaymentsFraudService,
    PaymentsIntentsService,
    PaymentsCheckoutService,
    PaymentsSettlementService,
    PaymentsRefundsService,
    PaymentsDisputesService,
    PaymentsPayoutsService,
    PaymentCompletionService,
    PaymentReceiptService,
    PaymentReceiptEmailService,
    PaymentsWebhooksService,
    StripeConnectService,
    PaymentNotificationsListener,
  ],
  exports: [PaymentsService, StripeConnectService, PaymentsAccessService, PaymentReceiptService, PaymentReceiptEmailService],
})
export class PaymentsModule {}
