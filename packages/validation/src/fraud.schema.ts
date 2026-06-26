import { z } from 'zod';

import { paginationSchema, uuidSchema } from './common.schema';

export const fraudListQuerySchema = paginationSchema.extend({
  minRiskScore: z.coerce.number().int().min(0).max(100).optional(),
});

export const fraudSignalsQuerySchema = paginationSchema.extend({
  userId: uuidSchema.optional(),
  listingId: uuidSchema.optional(),
  signalType: z
    .enum([
      'high_risk_keywords',
      'repeated_listing_duplication',
      'rapid_listing_creation',
      'mismatched_location',
      'multiple_accounts_same_device',
      'flagged_messages',
      'buyer_reports',
      'suspicious_pricing',
    ])
    .optional(),
});

export const fraudMarkSafeSchema = z.object({
  userId: uuidSchema,
  listingId: uuidSchema.optional(),
  signalIds: z.array(uuidSchema).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const fraudEscalateSchema = z.object({
  userId: uuidSchema,
  listingId: uuidSchema.optional(),
  notes: z.string().trim().min(1).max(2000).optional(),
});

export type FraudListQueryInput = z.infer<typeof fraudListQuerySchema>;
export type FraudSignalsQueryInput = z.infer<typeof fraudSignalsQuerySchema>;
export type FraudMarkSafeInput = z.infer<typeof fraudMarkSafeSchema>;
export type FraudEscalateInput = z.infer<typeof fraudEscalateSchema>;
