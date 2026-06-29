import { z } from 'zod';

import { uuidSchema } from './common.schema';

export const storeNameSchema = z.string().trim().min(2, 'Store name is required').max(100);

export const storeSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens');

const storeWeekdaySchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

export const storeDayHoursSchema = z.object({
  closed: z.boolean().optional(),
  open: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  close: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export const storeOpeningHoursSchema = z.object({
  timezone: z.string().max(60).optional(),
  note: z.string().max(300).optional(),
  schedule: z.record(storeWeekdaySchema, storeDayHoursSchema),
});

export const storePolicySchema = z.object({
  returns: z.string().max(1000).optional(),
  shipping: z.string().max(1000).optional(),
  responseTime: z.string().max(300).optional(),
});

export const storeContactSettingsSchema = z.object({
  phone: z.string().max(40).optional(),
  email: z.string().max(120).optional(),
  addressLine: z.string().max(255).optional(),
  website: z.string().max(255).optional(),
  showPhone: z.boolean().optional(),
  showEmail: z.boolean().optional(),
  showAddress: z.boolean().optional(),
});

export const createStoreSchema = z.object({
  name: storeNameSchema,
  description: z.string().max(500).optional(),
  location: z.string().max(120).optional(),
  preferredSlug: storeSlugSchema.optional(),
  contact: storeContactSettingsSchema.optional(),
  openingHours: storeOpeningHoursSchema.optional(),
  policies: storePolicySchema.optional(),
});

export const updateStoreSchema = z
  .object({
    name: storeNameSchema.optional(),
    description: z.string().max(500).optional(),
    location: z.string().max(120).optional(),
    logoUrl: z.string().url().optional(),
    bannerUrl: z.string().url().optional(),
    preferredSlug: storeSlugSchema.optional(),
    contact: storeContactSettingsSchema.optional(),
    openingHours: storeOpeningHoursSchema.optional(),
    policies: storePolicySchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const storeIdParamSchema = z.object({
  storeId: uuidSchema,
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
