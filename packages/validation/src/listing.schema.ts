import { z } from 'zod';

import { isoDateSchema, uuidSchema } from './common.schema';

export const listingStatusSchema = z.enum(['draft', 'active', 'sold', 'archived']);

export const listingConditionSchema = z.enum(['new', 'like_new', 'good', 'fair', 'poor']);

export const listingSchema = z.object({
  id: uuidSchema,
  sellerId: uuidSchema,
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  price: z.number().positive().max(1_000_000),
  currency: z.string().length(3).toUpperCase(),
  category: z.string().min(1).max(80),
  condition: listingConditionSchema,
  status: listingStatusSchema,
  location: z.string().min(1).max(120),
  imageUrls: z.array(z.string().url()).max(10),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const listingSummarySchema = z.object({
  id: uuidSchema,
  title: z.string().min(3).max(200),
  price: z.number().positive(),
  currency: z.string().length(3).toUpperCase(),
  location: z.string().min(1).max(120),
  status: listingStatusSchema,
  imageUrl: z.string().url().optional(),
});

export const createListingSchema = listingSchema.pick({
  title: true,
  description: true,
  price: true,
  currency: true,
  category: true,
  condition: true,
  location: true,
  imageUrls: true,
});

export const updateListingSchema = createListingSchema.partial();

export type ListingInput = z.infer<typeof listingSchema>;
export type ListingSummaryInput = z.infer<typeof listingSummarySchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
