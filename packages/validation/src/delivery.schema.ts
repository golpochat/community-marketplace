import { z } from 'zod';

import { uuidSchema } from './common.schema';

export const deliveryZoneSchema = z.enum(['COLLECTION', 'LOCAL', 'NATIONAL', 'CUSTOM']);

export const deliveryChangeStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const listingDeliverySelectionSchema = z.object({
  deliveryOptionId: uuidSchema,
  customLabel: z.string().min(1).max(120).optional(),
  customPrice: z.number().min(0).max(10_000).optional(),
});

export const updateListingDeliverySchema = z.object({
  selections: z.array(listingDeliverySelectionSchema).min(1).max(20),
});

export const deliveryReviewDecisionSchema = z.object({
  reviewNotes: z.string().max(2000).optional(),
});

export const deliveryOptionSchema = z.object({
  id: uuidSchema,
  label: z.string().min(1).max(120),
  description: z.string().max(500),
  zone: deliveryZoneSchema,
  defaultPrice: z.number().min(0).optional(),
  isActive: z.boolean(),
});

export type ListingDeliverySelectionInput = z.infer<typeof listingDeliverySelectionSchema>;
export type UpdateListingDeliveryInput = z.infer<typeof updateListingDeliverySchema>;
export type DeliveryReviewDecisionInput = z.infer<typeof deliveryReviewDecisionSchema>;
