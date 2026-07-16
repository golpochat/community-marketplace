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
  displayAdsEnabled: z.boolean().optional(),
  aiMarketingEnabled: z.boolean().optional(),
  boostPrice7d: z.number().min(0).max(999).optional(),
  boostPrice30d: z.number().min(0).max(999).optional(),
  featuredHomepagePrice: z.number().min(0).max(999).optional(),
  featuredCategoryPrice: z.number().min(0).max(999).optional(),
  fastTrackVerificationPrice: z.number().min(0).max(999).optional(),
  storeSlot2Price: z.number().min(0).max(999).optional(),
  storeSlot3Price: z.number().min(0).max(999).optional(),
  storeBundle3Price: z.number().min(0).max(999).optional(),
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

export const storeSlotSkuSchema = z.enum(['store_slot_2', 'store_slot_3', 'store_bundle_3']);

export const createStoreSlotIntentSchema = z.object({
  sku: storeSlotSkuSchema,
});

export const confirmStoreSlotSchema = z.object({
  purchaseId: uuidSchema,
});

export const statementPeriodQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const adminFinanceUserStatementQuerySchema = statementPeriodQuerySchema.extend({
  userId: uuidSchema,
});

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format');

function parseOptionalUuidList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseOptionalCategoryList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

const financeRecordCategorySchema = z.enum([
  'buyer',
  'seller',
  'platform_service',
  'marketplace_fee',
]);

export const adminFinanceDateRangeQuerySchema = z
  .object({
    dateFrom: isoDateSchema,
    dateTo: isoDateSchema,
    categories: z.string().optional(),
    search: z.string().max(200).optional(),
  })
  .transform((data) => ({
    dateFrom: data.dateFrom,
    dateTo: data.dateTo,
    categories: parseOptionalCategoryList(data.categories),
    search: data.search?.trim() ?? '',
  }))
  .superRefine((data, ctx) => {
    if (data.dateFrom > data.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dateFrom must be on or before dateTo',
        path: ['dateFrom'],
      });
    }
    for (const category of data.categories) {
      const parsed = financeRecordCategorySchema.safeParse(category);
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid category: ${category}`,
          path: ['categories'],
        });
      }
    }
  });

export const adminFinanceActivityStatementQuerySchema = z
  .object({
    dateFrom: isoDateSchema,
    dateTo: isoDateSchema,
    userId: uuidSchema,
  })
  .superRefine((data, ctx) => {
    if (data.dateFrom > data.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dateFrom must be on or before dateTo',
        path: ['dateFrom'],
      });
    }
  });

export const createBuyerStatementIntentSchema = statementPeriodQuerySchema;

export const confirmBuyerStatementSchema = z.object({
  purchaseId: uuidSchema,
});

export const platformPurchasesAdminFiltersSchema = paginationSchema.extend({
  type: z
    .enum([
      'listing_boost',
      'featured_slot',
      'fast_track_verification',
      'store_slot_2',
      'store_slot_3',
      'store_bundle_3',
      'buyer_statement',
    ])
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
export type CreateStoreSlotIntentInput = z.infer<typeof createStoreSlotIntentSchema>;
export type ConfirmStoreSlotInput = z.infer<typeof confirmStoreSlotSchema>;
export type CreateBuyerStatementIntentInput = z.infer<typeof createBuyerStatementIntentSchema>;
export type ConfirmBuyerStatementInput = z.infer<typeof confirmBuyerStatementSchema>;
export type StatementPeriodQueryInput = z.infer<typeof statementPeriodQuerySchema>;
export type AdminFinanceUserStatementQueryInput = z.infer<
  typeof adminFinanceUserStatementQuerySchema
>;
export type AdminFinanceDateRangeQueryInput = z.infer<typeof adminFinanceDateRangeQuerySchema>;
export type AdminFinanceActivityStatementQueryInput = z.infer<
  typeof adminFinanceActivityStatementQuerySchema
>;
export type PlatformPurchasesAdminFiltersInput = z.infer<
  typeof platformPurchasesAdminFiltersSchema
>;
export type FeaturedListingsQueryInput = z.infer<typeof featuredListingsQuerySchema>;

export const sellerFeeOverrideSchema = z.object({
  userId: uuidSchema,
  customPlatformFeePercent: feePercentSchema.nullable(),
  reason: z.string().max(500).optional(),
});

export const buyerCashbackOverrideSchema = z.object({
  userId: uuidSchema,
  customCashbackPercent: z.number().min(0).max(10).nullable(),
  reason: z.string().max(500).optional(),
});

export const cashbackGrantsAdminFiltersSchema = paginationSchema.extend({
  status: z.enum(['pending', 'earned', 'cancelled']).optional(),
  userId: uuidSchema.optional(),
});

export const walletTransactionsAdminFiltersSchema = paginationSchema.extend({
  userId: uuidSchema.optional(),
  type: z.enum(['cashback_earned', 'expired', 'ai_generation']).optional(),
});

export const cashbackEstimateQuerySchema = z.object({
  listingId: uuidSchema,
});

export type PlatformSettingsUpdateInput = z.infer<typeof platformSettingsUpdateSchema>;
export type SellerFeeOverrideInput = z.infer<typeof sellerFeeOverrideSchema>;
export type BuyerCashbackOverrideInput = z.infer<typeof buyerCashbackOverrideSchema>;

export const monetizationSellerSearchSchema = z.object({
  q: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().positive().max(25).optional(),
});

export const monetizationProductUpsertSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9_]+$/, 'Code must be lowercase letters, numbers, and underscores'),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  type: z.enum(['listing_boost', 'featured_slot']),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  price: z.coerce.number().min(0).max(9999),
  currency: z.string().length(3).default('EUR'),
  durationDays: z.coerce.number().int().positive().max(365).optional(),
  durationHours: z.coerce.number().int().positive().max(24 * 30).optional(),
  placement: z.string().trim().max(64).optional(),
  packageType: z.enum(['PAID_7D', 'PAID_30D']).optional(),
  slotsPerDay: z.coerce.number().int().positive().max(1000).optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

export const monetizationProductUpdateSchema = monetizationProductUpsertSchema.partial();

export type MonetizationSellerSearchInput = z.infer<typeof monetizationSellerSearchSchema>;
export type MonetizationProductUpsertInput = z.infer<typeof monetizationProductUpsertSchema>;
export type MonetizationProductUpdateInput = z.infer<typeof monetizationProductUpdateSchema>;
