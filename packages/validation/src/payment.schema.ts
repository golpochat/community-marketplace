import { z } from 'zod';

import { isoDateSchema, uuidSchema } from './common.schema';

export const paymentStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
]);

export const paymentMethodSchema = z.enum(['card', 'bank_transfer', 'wallet']);

export const paymentSchema = z.object({
  id: uuidSchema,
  buyerId: uuidSchema,
  sellerId: uuidSchema,
  listingId: uuidSchema,
  amount: z.number().positive().max(10_000_000),
  currency: z.string().length(3).toUpperCase(),
  method: paymentMethodSchema,
  status: paymentStatusSchema,
  transactionRef: z.string().max(120).optional(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const createPaymentSchema = paymentSchema.pick({
  listingId: true,
  amount: true,
  currency: true,
  method: true,
});

export type PaymentInput = z.infer<typeof paymentSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
