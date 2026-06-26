import { z } from 'zod';

import { paginationSchema, uuidSchema } from './common.schema';

const disputeReasonSchema = z.enum([
  'item_not_received',
  'item_not_as_described',
  'damaged',
  'wrong_item',
  'other',
]);

const marketplaceDisputeStatusSchema = z.enum([
  'open',
  'awaiting_evidence',
  'under_review',
  'resolved_buyer_favored',
  'resolved_seller_favored',
  'closed',
]);

const evidenceContentTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

export const createDisputeSchema = z.object({
  listingId: uuidSchema,
  paymentId: uuidSchema.optional(),
  reason: disputeReasonSchema,
  description: z.string().trim().min(10).max(5000),
});

export const disputeUploadEvidenceSchema = z.union([
  z.object({
    disputeId: uuidSchema,
    contentType: z.enum(evidenceContentTypes),
    fileName: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(1000).optional(),
  }),
  z.object({
    disputeId: uuidSchema,
    filePath: z.string().trim().min(1).max(500),
    description: z.string().trim().max(1000).optional(),
  }),
]);

export const disputeRespondSchema = z.object({
  disputeId: uuidSchema,
  messageText: z.string().trim().min(1).max(5000),
  filePath: z.string().trim().min(1).max(500).optional(),
  evidenceDescription: z.string().trim().max(1000).optional(),
});

export const disputeListQuerySchema = paginationSchema.extend({
  status: marketplaceDisputeStatusSchema.optional(),
});

export const adminDisputeListQuerySchema = paginationSchema.extend({
  status: marketplaceDisputeStatusSchema.optional(),
});

export const adminRequestEvidenceSchema = z.object({
  notes: z.string().trim().min(1).max(2000).optional(),
});

export const adminResolveDisputeSchema = z.object({
  outcome: z.enum(['resolved_buyer_favored', 'resolved_seller_favored', 'closed']),
  resolutionNotes: z.string().trim().min(1).max(5000),
});

export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
export type DisputeUploadEvidenceInput = z.infer<typeof disputeUploadEvidenceSchema>;
export type DisputeRespondInput = z.infer<typeof disputeRespondSchema>;
export type DisputeListQueryInput = z.infer<typeof disputeListQuerySchema>;
export type AdminDisputeListQueryInput = z.infer<typeof adminDisputeListQuerySchema>;
export type AdminRequestEvidenceInput = z.infer<typeof adminRequestEvidenceSchema>;
export type AdminResolveDisputeInput = z.infer<typeof adminResolveDisputeSchema>;
