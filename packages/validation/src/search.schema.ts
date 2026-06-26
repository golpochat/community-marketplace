import { z } from 'zod';

import { listingConditionSchema, listingSortSchema } from './listing.schema';
import { paginationSchema, uuidSchema } from './common.schema';

export const searchIndexNameSchema = z.enum([
  'listings',
  'users',
  'categories',
  'chat_threads',
]);

export const searchEntityTypeSchema = z.enum([
  'listings',
  'users',
  'categories',
  'sellers',
  'global',
]);

export const listingSearchQuerySchema = paginationSchema.extend({
  q: z.string().max(200).optional(),
  categoryId: uuidSchema.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  condition: listingConditionSchema.optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(0.1).max(500).optional(),
  sort: listingSortSchema.optional().default('newest'),
  cursor: z.string().max(100).optional(),
  semantic: z.coerce.boolean().optional().default(false),
  deliveryAvailable: z.coerce.boolean().optional(),
  deliveryCollection: z.coerce.boolean().optional(),
  sellerVerified: z.coerce.boolean().optional(),
  sellerBusiness: z.coerce.boolean().optional(),
  minSellerRating: z.coerce.number().min(1).max(5).optional(),
  make: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  minYear: z.coerce.number().int().min(1900).max(2100).optional(),
  maxYear: z.coerce.number().int().min(1900).max(2100).optional(),
  minMileage: z.coerce.number().min(0).optional(),
  maxMileage: z.coerce.number().min(0).optional(),
  fuelType: z.string().max(50).optional(),
  transmission: z.string().max(50).optional(),
  bodyType: z.string().max(50).optional(),
  engineSize: z.string().max(20).optional(),
  seats: z.string().max(10).optional(),
  doors: z.string().max(10).optional(),
  brand: z.string().max(100).optional(),
  storage: z.string().max(50).optional(),
  material: z.string().max(100).optional(),
  serviceType: z.string().max(100).optional(),
  clothingSize: z.string().max(20).optional(),
  gender: z.string().max(20).optional(),
  area: z.string().max(120).optional(),
  freeOnly: z.coerce.boolean().optional(),
});

export const autocompleteQuerySchema = z.object({
  q: z.string().min(1).max(100),
  types: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',') : ['listing', 'category', 'seller'])),
  limit: z.coerce.number().int().min(1).max(20).optional().default(8),
});

export const globalSearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  includeRestricted: z.coerce.boolean().optional().default(false),
});

export const reindexSchema = z.object({
  type: searchIndexNameSchema,
});

export const searchSynonymSchema = z.object({
  id: z.string().min(1).max(100),
  synonyms: z.array(z.string().min(1).max(100)).min(2),
});

export const searchStopWordsSchema = z.object({
  words: z.array(z.string().min(1).max(50)).min(1),
});

export const searchRelevanceRulesSchema = z.object({
  searchableAttributes: z.record(searchIndexNameSchema, z.array(z.string())).optional(),
  rankingRules: z.array(z.string()).optional(),
});

export const searchClickSchema = z.object({
  query: z.string().min(1).max(200),
  entity: searchEntityTypeSchema,
  clickedId: uuidSchema,
});

export type ListingSearchQueryInput = z.infer<typeof listingSearchQuerySchema>;
export type AutocompleteQueryInput = z.infer<typeof autocompleteQuerySchema>;
export type GlobalSearchQueryInput = z.infer<typeof globalSearchQuerySchema>;
export type ReindexInput = z.infer<typeof reindexSchema>;
