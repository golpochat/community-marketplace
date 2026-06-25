import { z } from 'zod';

export const priceChangeStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const listingPricingInputSchema = z
  .object({
    originalPrice: z.number().min(0.01).max(1_000_000).optional().nullable(),
    salePrice: z.number().min(0).max(1_000_000).optional().nullable(),
    price: z.number().min(0).max(1_000_000).optional(),
  })
  .refine(
    (data) => data.salePrice != null || data.price != null,
    { message: 'A sale price or list price is required' },
  )
  .refine(
    (data) => {
      if (data.originalPrice == null || data.salePrice == null) return true;
      return data.salePrice < data.originalPrice;
    },
    { message: 'Sale price must be lower than original price' },
  );

export const updateListingPricingSchema = listingPricingInputSchema;

export const priceReviewDecisionSchema = z.object({
  reviewNotes: z.string().max(2000).optional(),
});

export type ListingPricingInput = z.infer<typeof listingPricingInputSchema>;
export type UpdateListingPricingInput = z.infer<typeof updateListingPricingSchema>;
