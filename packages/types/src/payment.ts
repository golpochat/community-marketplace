export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'disputed';

export type PaymentMethod = 'card' | 'bank_transfer' | 'wallet';

export type PayoutStatus =
  | 'pending'
  | 'in_transit'
  | 'paid'
  | 'failed'
  | 'canceled';

export type LedgerEntryType = 'credit' | 'debit';

export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processed';

export type DisputeStatus =
  | 'open'
  | 'under_review'
  | 'won'
  | 'lost'
  | 'closed';

export type PaymentAuditEventType =
  | 'payment_created'
  | 'payment_confirmed'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'payment_refunded'
  | 'payment_disputed'
  | 'refund_requested'
  | 'refund_approved'
  | 'refund_rejected'
  | 'payout_created'
  | 'payout_paid'
  | 'payout_failed'
  | 'seller_settlement'
  | 'connect_onboarded';

export interface Payment {
  id: string;
  orderId?: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  platformFee?: number;
  feePercentApplied?: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  providerPaymentId?: string;
  providerRefundId?: string;
  clientSecret?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentIntentResponse {
  payment: Payment;
  clientSecret: string;
}

export interface CheckoutSessionResponse {
  payment: Payment;
  sessionId: string;
  checkoutUrl: string;
}

export interface OrderSettlementResult {
  paymentId: string;
  status: 'settled' | 'already_settled';
  transferId?: string;
  netAmount: number;
  currency: string;
  message?: string;
}

export interface StripeConnectAccount {
  id: string;
  userId: string;
  stripeAccountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingComplete: boolean;
  onboardingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payout {
  id: string;
  sellerId: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  providerPayoutId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  type: LedgerEntryType;
  amount: number;
  currency: string;
  referenceId?: string;
  paymentId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PaymentRefund {
  id: string;
  paymentId: string;
  requestedById: string;
  approvedById?: string;
  amount: number;
  reason?: string;
  status: RefundStatus;
  providerRefundId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentDispute {
  id: string;
  paymentId: string;
  providerDisputeId: string;
  status: DisputeStatus;
  reason?: string;
  evidence?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SellerEarningsSummary {
  totalEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
  currency: string;
  paymentCount: number;
}
