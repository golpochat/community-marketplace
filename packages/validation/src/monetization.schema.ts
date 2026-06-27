import { z } from 'zod';

import { paymentMethodSchema } from './payment.schema';
import { paginationSchema, uuidSchema } from './common.schema';

const feePercentSchema = z.number().min(3).max(15);

export const platformSettingsUpdateSchema = z.object({
  defaultPlatformFeePercent: feePercentSchema.optional(),
  verifiedSellerFeePercent: feePercentSchema.optional(),
  cashbackPercent: z.number().min(0).max(10).optional(),
  coolingDays: z.number().int().min(1).max(90).optional(),
  maxCashbackPerOrder: z.number().min(0).max(10_000).optional(),
  maxCashbackPerMonth: z.number().min(0).max(10_000).optional(),
  cashbackEnabled: z.boolean().optional(),
  cashbackMinOrderAmount: z.number().min(0).max(10_000).optional(),
  allowedCashbackMethods: z.array(paymentMethodSchema).min(1).optional(),
  boostsEnabled: z.boolean().optional(),
  featuredEnabled: z.boolean().optional(),
  boostPrice7d: z.number().min(0).max(999).optional(),
  boostPrice30d: z.number().min(0).max(999).optional(),
  featuredHomepagePrice: z.number().min(0).max(999).optional(),
  featuredCategoryPrice: z.number().min(0).max(999).optional(),
  fastTrackVerificationPrice: z.number().min(0).max(999).optional(),
  homepageSlotsPerDay: z.number().int().min(1).max(100).optional(),
  categorySlotsPerDay: z.number().int().min(1).max(100).optional(),
});

export const boostPackageTypeSchema = z.enum(['PAID_7D', 'PAID_30D']);

export const createBoostIntentSchema = z.object({
  listingId: uuidSchema,
  packageType: boostPackageTypeSchema,
});

export const confirmBoostSchema = z.object({
  purchaseId: uuidSchema,
});

export const featuredPlacementSchema = z.enum(['homepage', 'category']);

export const createFeaturedIntentSchema = z
  .object({
    listingId: uuidSchema,
    placement: featuredPlacementSchema,
    categoryId: uuidSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.placement === 'category' && !value.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'categoryId is required for category featured placement',
        path: ['categoryId'],
      });
    }
  });

export const confirmFeaturedSchema = z.object({
  purchaseId: uuidSchema,
});

export const confirmFastTrackSchema = z.object({
  purchaseId: uuidSchema,
});

export const platformPurchasesAdminFiltersSchema = paginationSchema.extend({
  type: z
    .enum(['listing_boost', 'featured_slot', 'fast_track_verification'])
    .optional(),
  status: z.enum(['pending', 'succeeded', 'failed', 'refunded']).optional(),
  userId: uuidSchema.optional(),
});

export const featuredListingsQuerySchema = z
  .object({
    placement: featuredPlacementSchema,
    categoryId: uuidSchema.optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.placement === 'category' && !value.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'categoryId is required when placement is category',
        path: ['categoryId'],
      });
    }
  });

export type CreateBoostIntentInput = z.infer<typeof createBoostIntentSchema>;
export type ConfirmBoostInput = z.infer<typeof confirmBoostSchema>;
export type CreateFeaturedIntentInput = z.infer<typeof createFeaturedIntentSchema>;
export type ConfirmFeaturedInput = z.infer<typeof confirmFeaturedSchema>;
export type ConfirmFastTrackInput = z.infer<typeof confirmFastTrackSchema>;
export type PlatformPurchasesAdminFiltersInput = z.infer<
  typeof platformPurchasesAdminFiltersSchema
>;
export type FeaturedListingsQueryInput = z.infer<typeof featuredListingsQuerySchema>;

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
