import { z } from 'zod';

import { listingTitleFieldSchema } from './listing.schema';

export const titleChangeStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const updateListingTitleSchema = z.object({
  title: listingTitleFieldSchema,
});

export const titleReviewDecisionSchema = z.object({
  reviewNotes: z.string().max(2000).optional(),
});

export type UpdateListingTitleInput = z.infer<typeof updateListingTitleSchema>;
