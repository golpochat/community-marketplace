import { z } from 'zod';

import { DEFAULT_CURRENCY } from '@community-marketplace/config/constants';
import { PLATFORM_COUNTRY_CODE } from '@community-marketplace/config/platform';

import { isoDateSchema, paginationSchema, uuidSchema } from './common.schema';

export const paymentStatusSchema = z.enum([
  'pending',
  'processing',
  'succeeded',
  'failed',
  'refunded',
  'disputed',
]);

export const paymentMethodSchema = z.enum(['card', 'bank_transfer', 'wallet']);

export const payoutStatusSchema = z.enum([
  'pending',
  'in_transit',
  'paid',
  'failed',
  'canceled',
]);

export const ledgerEntryTypeSchema = z.enum(['credit', 'debit']);

export const refundStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'processed',
]);

export const paymentSchema = z.object({
  id: uuidSchema,
  orderId: uuidSchema.optional(),
  listingId: uuidSchema,
  buyerId: uuidSchema,
  sellerId: uuidSchema,
  amount: z.number().positive().max(10_000_000),
  platformFee: z.number().min(0).optional(),
  feePercentApplied: z.number().min(0).max(100).optional(),
  currency: z.string().length(3).toUpperCase(),
  method: paymentMethodSchema,
  status: paymentStatusSchema,
  providerPaymentId: z.string().max(200).optional(),
  providerRefundId: z.string().max(200).optional(),
  clientSecret: z.string().max(500).optional(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const createPaymentIntentSchema = z.object({
  listingId: uuidSchema,
  method: paymentMethodSchema.default('card'),
});

export const confirmPaymentSchema = z.object({
  paymentId: uuidSchema,
});

export const connectOnboardSchema = z.object({
  country: z.string().length(2).toUpperCase().optional().default(PLATFORM_COUNTRY_CODE),
  returnUrl: z.string().url().optional(),
  refreshUrl: z.string().url().optional(),
});

export const requestRefundSchema = z.object({
  paymentId: uuidSchema,
  reason: z.string().min(3).max(500).optional(),
});

export const approveRefundSchema = z.object({
  refundId: uuidSchema,
  approve: z.boolean(),
  reason: z.string().max(500).optional(),
});

export const disputeEvidenceSchema = z.object({
  disputeId: uuidSchema,
  evidence: z.record(z.unknown()),
});

export const paymentAdminFiltersSchema = paginationSchema.extend({
  status: paymentStatusSchema.optional(),
  buyerId: uuidSchema.optional(),
  sellerId: uuidSchema.optional(),
  listingId: uuidSchema.optional(),
});

export const manualPayoutSchema = z.object({
  sellerId: uuidSchema,
  amount: z.number().positive(),
  currency: z.string().length(3).toUpperCase().default(DEFAULT_CURRENCY),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
export type ConnectOnboardInput = z.infer<typeof connectOnboardSchema>;
export type RequestRefundInput = z.infer<typeof requestRefundSchema>;
export type ApproveRefundInput = z.infer<typeof approveRefundSchema>;
export type DisputeEvidenceInput = z.infer<typeof disputeEvidenceSchema>;
