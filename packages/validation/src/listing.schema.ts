import { z } from 'zod';

import { DEFAULT_CURRENCY } from '@community-marketplace/config/constants';

import { isoDateSchema, paginationSchema, uuidSchema } from './common.schema';

export const listingStatusSchema = z.enum([
  'draft',
  'pending_review',
  'active',
  'paused',
  'expired',
  'sold',
  'ended',
  'removed',
  'rejected',
]);

export const listingPackageTypeSchema = z.enum([
  'FREE',
  'PAID_7D',
  'PAID_30D',
  'PAID_60D',
  'PAID_90D',
  'PREMIUM_UNTIL_SOLD',
]);

export const listingConditionSchema = z.enum([
  'new',
  'like_new',
  'good',
  'fair',
  'poor',
]);

export const listingSortSchema = z.enum([
  'newest',
  'price_low_to_high',
  'price_high_to_low',
  'nearest',
]);

export const listingFeedTypeSchema = z.enum([
  'new_near_you',
  'free_near_you',
  'trending',
  'recently_sold_near_you',
]);

export const listingLocationSchema = z.object({
  label: z.string().min(1).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const listingImageSchema = z.object({
  id: uuidSchema,
  listingId: uuidSchema,
  url: z.string().url(),
  order: z.number().int().min(0).max(9),
});

export const categorySchema = z.object({
  id: uuidSchema,
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(80),
  icon: z.string().max(120).optional(),
  description: z.string().max(500).optional(),
  parentId: uuidSchema.optional(),
  isActive: z.boolean(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const listingSchema = z.object({
  id: uuidSchema,
  sellerId: uuidSchema,
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  price: z.number().min(0).max(1_000_000),
  currency: z.string().length(3).toUpperCase(),
  categoryId: uuidSchema,
  condition: listingConditionSchema,
  status: listingStatusSchema,
  location: listingLocationSchema,
  images: z.array(listingImageSchema).max(10),
  viewCount: z.number().int().min(0),
  favoriteCount: z.number().int().min(0),
  moderationNotes: z.string().max(2000).optional(),
  originalPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  bannedAt: isoDateSchema.optional(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const listingSummarySchema = z.object({
  id: uuidSchema,
  title: z.string().min(3).max(200),
  price: z.number().min(0),
  originalPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  currency: z.string().length(3).toUpperCase(),
  location: listingLocationSchema,
  status: listingStatusSchema,
  condition: listingConditionSchema,
  categoryId: uuidSchema,
  imageUrl: z.string().url().optional(),
  distanceKm: z.number().min(0).optional(),
  favoriteCount: z.number().int().min(0),
  createdAt: isoDateSchema,
});

export const createListingSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  price: z.number().min(0).max(1_000_000),
  originalPrice: z.number().min(0.01).max(1_000_000).optional().nullable(),
  salePrice: z.number().min(0).max(1_000_000).optional().nullable(),
  currency: z.string().length(3).toUpperCase().default(DEFAULT_CURRENCY),
  categoryId: uuidSchema,
  condition: listingConditionSchema,
  location: listingLocationSchema,
  deliverySelections: z.array(
    z.object({
      deliveryOptionId: uuidSchema,
      customLabel: z.string().min(1).max(120).optional(),
      customPrice: z.number().min(0).max(10_000).optional(),
    }),
  ).min(1).max(20).optional(),
  status: z.enum(['draft', 'active']).optional().default('draft'),
});

export const updateListingSchema = createListingSchema
  .partial()
  .extend({
    status: listingStatusSchema.optional(),
  });

export const listingSearchFiltersSchema = paginationSchema.extend({
  q: z.string().max(200).optional(),
  categoryId: uuidSchema.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  condition: listingConditionSchema.optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(0.1).max(500).optional(),
  sort: listingSortSchema.optional().default('newest'),
});

export const listingFeedQuerySchema = z.object({
  feed: listingFeedTypeSchema,
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(100).optional().default(25),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const listingImageUploadRequestSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  fileName: z.string().max(200).optional(),
  fileSizeBytes: z.number().int().min(1).max(5 * 1024 * 1024),
});

export const confirmListingImagesSchema = z.object({
  keys: z.array(z.string().min(1)).min(1).max(10),
  orders: z.array(z.number().int().min(0).max(9)).optional(),
});

export const reorderListingImagesSchema = z.object({
  imageOrders: z
    .array(
      z.object({
        imageId: uuidSchema,
        order: z.number().int().min(0).max(9),
      }),
    )
    .min(1)
    .max(10),
});

export const reportListingSchema = z.object({
  reason: z.string().min(3).max(120),
  description: z.string().max(2000).optional(),
});

export const listingReviewMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const requestListingChangesSchema = listingReviewMessageSchema;

export const renewListingSchema = z.object({
  packageType: listingPackageTypeSchema,
});

export const rejectListingSchema = z.object({
  reason: z.string().min(3).max(2000),
});

export const removeListingSchema = z.object({
  reason: z.string().min(3).max(2000).optional(),
});

export const restoreListingSchema = z.object({
  targetStatus: z.enum(['expired', 'draft']).optional().default('expired'),
});

export const listingModerationActionSchema = z.object({
  action: z.enum(['ban_listing', 'warn_seller', 'dismiss', 'none']),
  moderationNotes: z.string().max(2000).optional(),
  warnMessage: z.string().max(2000).optional(),
});

export const listingAdminFiltersSchema = paginationSchema.extend({
  status: listingStatusSchema.optional(),
  categoryId: uuidSchema.optional(),
  sellerId: uuidSchema.optional(),
  search: z.string().max(200).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(80).optional(),
  icon: z.string().max(120).optional(),
  description: z.string().max(500).optional(),
  parentId: uuidSchema.optional(),
});

export type ListingInput = z.infer<typeof listingSchema>;
export type ListingSummaryInput = z.infer<typeof listingSummarySchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingSearchFiltersInput = z.infer<typeof listingSearchFiltersSchema>;
export type ListingFeedQueryInput = z.infer<typeof listingFeedQuerySchema>;
export type ReportListingInput = z.infer<typeof reportListingSchema>;
export type ListingModerationActionInput = z.infer<typeof listingModerationActionSchema>;
export type ListingAdminFiltersInput = z.infer<typeof listingAdminFiltersSchema>;
