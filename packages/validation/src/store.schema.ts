import { z } from 'zod';

import { uuidSchema } from './common.schema';

export const storeNameSchema = z.string().trim().min(2, 'Store name is required').max(100);

export const storeSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens');

export const createStoreSchema = z.object({
  name: storeNameSchema,
  description: z.string().max(500).optional(),
  location: z.string().max(120).optional(),
  preferredSlug: storeSlugSchema.optional(),
});

export const updateStoreSchema = z
  .object({
    name: storeNameSchema.optional(),
    description: z.string().max(500).optional(),
    location: z.string().max(120).optional(),
    logoUrl: z.string().url().optional(),
    bannerUrl: z.string().url().optional(),
    preferredSlug: storeSlugSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const storeIdParamSchema = z.object({
  storeId: uuidSchema,
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
