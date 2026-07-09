import type { Prisma } from '@prisma/client';

import type {
  LedgerEntry,
  Payment,
  PaymentDispute,
  PaymentRefund,
  Payout,
  StripeConnectAccount,
} from '@community-marketplace/types';

export const paymentInclude = {
  buyer: true,
  seller: true,
  listing: { include: { images: { take: 1, orderBy: { sortOrder: 'asc' as const } } } },
} satisfies Prisma.PaymentInclude;

export function mapPayment(row: {
  id: string;
  orderId: string | null;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: Prisma.Decimal;
  platformFee: Prisma.Decimal | null;
  feePercentApplied: Prisma.Decimal | null;
  currency: string;
  method: string;
  status: string;
  providerPaymentId: string | null;
  providerRefundId: string | null;
  clientSecret: string | null;
  receiptNumber: string | null;
  buyerReceiptKey: string | null;
  sellerReceiptKey: string | null;
  receiptGeneratedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Payment {
  return {
    id: row.id,
    orderId: row.orderId ?? undefined,
    listingId: row.listingId,
    buyerId: row.buyerId,
    sellerId: row.sellerId,
    amount: Number(row.amount),
    platformFee: row.platformFee ? Number(row.platformFee) : undefined,
    feePercentApplied: row.feePercentApplied ? Number(row.feePercentApplied) : undefined,
    currency: row.currency,
    method: row.method as Payment['method'],
    status: row.status as Payment['status'],
    providerPaymentId: row.providerPaymentId ?? undefined,
    providerRefundId: row.providerRefundId ?? undefined,
    clientSecret: row.clientSecret ?? undefined,
    receiptNumber: row.receiptNumber ?? undefined,
    receiptAvailable: Boolean(row.receiptGeneratedAt && row.buyerReceiptKey),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapConnectAccount(
  row: {
    id: string;
    userId: string;
    stripeAccountId: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    onboardingComplete: boolean;
    createdAt: Date;
    updatedAt: Date;
  },
  onboardingUrl?: string,
): StripeConnectAccount {
  return {
    id: row.id,
    userId: row.userId,
    stripeAccountId: row.stripeAccountId,
    chargesEnabled: row.chargesEnabled,
    payoutsEnabled: row.payoutsEnabled,
    onboardingComplete: row.onboardingComplete,
    onboardingUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapPayout(row: {
  id: string;
  sellerId: string;
  amount: Prisma.Decimal;
  currency: string;
  status: string;
  providerPayoutId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Payout {
  return {
    id: row.id,
    sellerId: row.sellerId,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status as Payout['status'],
    providerPayoutId: row.providerPayoutId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapLedgerEntry(row: {
  id: string;
  userId: string;
  type: string;
  amount: Prisma.Decimal;
  currency: string;
  referenceId: string | null;
  paymentId: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}): LedgerEntry {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as LedgerEntry['type'],
    amount: Number(row.amount),
    currency: row.currency,
    referenceId: row.referenceId ?? undefined,
    paymentId: row.paymentId ?? undefined,
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapRefund(row: {
  id: string;
  paymentId: string;
  requestedById: string;
  approvedById: string | null;
  amount: Prisma.Decimal;
  reason: string | null;
  status: string;
  providerRefundId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PaymentRefund {
  return {
    id: row.id,
    paymentId: row.paymentId,
    requestedById: row.requestedById,
    approvedById: row.approvedById ?? undefined,
    amount: Number(row.amount),
    reason: row.reason ?? undefined,
    status: row.status as PaymentRefund['status'],
    providerRefundId: row.providerRefundId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapRefundWithPaymentContext(
  row: Parameters<typeof mapRefund>[0],
  context: { listingTitle?: string; buyerEmail?: string },
): PaymentRefund {
  return {
    ...mapRefund(row),
    listingTitle: context.listingTitle,
    buyerEmail: context.buyerEmail,
  };
}

export function mapDispute(row: {
  id: string;
  paymentId: string;
  providerDisputeId: string;
  status: string;
  reason: string | null;
  evidence: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}): PaymentDispute {
  return {
    id: row.id,
    paymentId: row.paymentId,
    providerDisputeId: row.providerDisputeId,
    status: row.status as PaymentDispute['status'],
    reason: row.reason ?? undefined,
    evidence: (row.evidence as Record<string, unknown> | null) ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function calculatePlatformFee(amount: number, percent?: number): number {
  const feePercent = percent ?? Number(process.env.PLATFORM_FEE_PERCENT ?? 10);
  return Math.round(amount * (feePercent / 100) * 100) / 100;
}
