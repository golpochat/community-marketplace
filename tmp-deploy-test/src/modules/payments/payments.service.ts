import { Injectable } from '@nestjs/common';

import type {
  Payment,
  PaymentDispute,
  PaymentIntentResponse,
  PaymentRefund,
  Payout,
  SellerEarningsSummary,
  StripeConnectAccount,
} from '@community-marketplace/types';
import type {
  ApproveRefundInput,
  ConfirmPaymentInput,
  ConnectOnboardInput,
  CreatePaymentIntentInput,
  DisputeEvidenceInput,
  RequestRefundInput,
} from '@community-marketplace/validation';

import type { ManualPayoutInput, PaymentAdminFiltersInput } from './dto/payments.dto';
import { PaymentsCrudService } from './services/payments-crud.service';
import { PaymentsDisputesService } from './services/payments-disputes.service';
import { PaymentsIntentsService } from './services/payments-intents.service';
import { PaymentsLedgerService } from './services/payments-ledger.service';
import { PaymentsPayoutsService } from './services/payments-payouts.service';
import { PaymentsRefundsService } from './services/payments-refunds.service';
import { StripeConnectService } from './services/stripe-connect.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly crud: PaymentsCrudService,
    private readonly intents: PaymentsIntentsService,
    private readonly refunds: PaymentsRefundsService,
    private readonly disputes: PaymentsDisputesService,
    private readonly payouts: PaymentsPayoutsService,
    private readonly ledger: PaymentsLedgerService,
    private readonly stripeConnect: StripeConnectService,
  ) {}

  createPaymentIntent(
    buyerId: string,
    dto: CreatePaymentIntentInput,
  ): Promise<PaymentIntentResponse> {
    return this.intents.createPaymentIntent(buyerId, dto);
  }

  confirmPayment(buyerId: string, dto: ConfirmPaymentInput): Promise<Payment> {
    return this.intents.confirmPayment(buyerId, dto);
  }

  findById(id: string): Promise<Payment> {
    return this.crud.findById(id);
  }

  findByUser(userId: string, page?: number, limit?: number) {
    return this.crud.findByUser(userId, page, limit);
  }

  findBuyerHistory(buyerId: string, page?: number, limit?: number) {
    return this.crud.findBuyerHistory(buyerId, page, limit);
  }

  adminList(filters: PaymentAdminFiltersInput) {
    return this.crud.adminList(filters);
  }

  onboardConnect(userId: string, dto: ConnectOnboardInput): Promise<StripeConnectAccount> {
    return this.stripeConnect.createConnectAccount(userId, dto);
  }

  getConnectAccount(userId: string): Promise<StripeConnectAccount | null> {
    return this.stripeConnect.getAccount(userId);
  }

  getConnectAccountForAdmin(userId: string): Promise<StripeConnectAccount | null> {
    return this.stripeConnect.getAccountForAdmin(userId);
  }

  requestRefund(buyerId: string, dto: RequestRefundInput): Promise<PaymentRefund> {
    return this.refunds.requestRefund(buyerId, dto);
  }

  approveRefund(adminId: string, dto: ApproveRefundInput): Promise<PaymentRefund> {
    return this.refunds.approveRefund(adminId, dto);
  }

  listPendingRefunds(page?: number, limit?: number) {
    return this.refunds.listPending(page, limit);
  }

  listDisputes(page?: number, limit?: number) {
    return this.disputes.list(page, limit);
  }

  getDispute(id: string): Promise<PaymentDispute> {
    return this.disputes.findById(id);
  }

  addDisputeEvidence(adminId: string, dto: DisputeEvidenceInput): Promise<PaymentDispute> {
    return this.disputes.addEvidence(adminId, dto);
  }

  listPayouts(sellerId: string, page?: number, limit?: number) {
    return this.payouts.listForSeller(sellerId, page, limit);
  }

  getEarningsSummary(sellerId: string): Promise<SellerEarningsSummary> {
    return this.payouts.getEarningsSummary(sellerId);
  }

  triggerManualPayout(adminId: string, dto: ManualPayoutInput): Promise<Payout> {
    return this.payouts.triggerManualPayout(adminId, dto);
  }

  listLedger(page?: number, limit?: number) {
    return this.ledger.listAll(page, limit);
  }

  listUserLedger(userId: string, page?: number, limit?: number) {
    return this.ledger.listForUser(userId, page, limit);
  }
}
