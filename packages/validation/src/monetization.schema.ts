import { z } from 'zod';

import { paymentMethodSchema } from './payment.schema';
import { paginationSchema, uuidSchema } from './common.schema';

const feePercentSchema = z.number().min(3).max(15);

export const platformSettingsUpdateSchema = z.object({
  defaultPlatformFeePercent: feePercentSchema.optional(),
  cashbackPercent: z.number().min(0).max(10).optional(),
  coolingDays: z.number().int().min(1).max(90).optional(),
  maxCashbackPerOrder: z.number().min(0).max(10_000).optional(),
  maxCashbackPerMonth: z.number().min(0).max(10_000).optional(),
  cashbackEnabled: z.boolean().optional(),
  cashbackMinOrderAmount: z.number().min(0).max(10_000).optional(),
  allowedCashbackMethods: z.array(paymentMethodSchema).min(1).optional(),
});

export const sellerFeeOverrideSchema = z.object({
  userId: uuidSchema,
  customPlatformFeePercent: feePercentSchema.nullable(),
  reason: z.string().max(500).optional(),
});

export const cashbackGrantsAdminFiltersSchema = paginationSchema.extend({
  status: z.enum(['pending', 'earned', 'cancelled']).optional(),
  userId: uuidSchema.optional(),
});

export const walletTransactionsAdminFiltersSchema = paginationSchema.extend({
  userId: uuidSchema.optional(),
  type: z.enum(['cashback_earned', 'expired']).optional(),
});

export const cashbackEstimateQuerySchema = z.object({
  listingId: uuidSchema,
});

export type PlatformSettingsUpdateInput = z.infer<typeof platformSettingsUpdateSchema>;
export type SellerFeeOverrideInput = z.infer<typeof sellerFeeOverrideSchema>;
