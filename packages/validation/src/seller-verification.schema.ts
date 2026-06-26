import { z } from 'zod';

import { phoneSchema } from './auth.schema';

export const sellerVerificationStartSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('send_otp'),
    phone: phoneSchema,
  }),
  z.object({
    action: z.literal('verify_otp'),
    phone: phoneSchema,
    code: z.string().min(4).max(8),
  }),
  z.object({
    action: z.literal('check'),
  }),
]);

export const sellerVerificationUploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  fileName: z.string().min(1).max(120).optional(),
});

export const sellerVerificationFlowSubmitSchema = z.object({
  phoneNumber: phoneSchema.optional(),
  idDocumentPath: z.string().min(1),
  selfiePath: z.string().min(1),
  addressDocumentPath: z.string().min(1).optional(),
});

export const sellerVerificationReviewSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const sellerSuspendSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().max(500).optional(),
  duration: z.enum(['7_days', '30_days', 'permanent']).optional(),
});

export const sellerLimitSchema = z.object({
  userId: z.string().uuid(),
  sellerLimit: z.number().int().min(0).max(100),
  reason: z.string().max(500).optional(),
});

export const adminSellerVerificationListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  view: z
    .enum(['pending', 'under_review', 'approved', 'rejected', 'suspended'])
    .default('pending'),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  search: z.string().max(120).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export const sellerReverificationSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export type SellerVerificationStartInput = z.infer<typeof sellerVerificationStartSchema>;
export type SellerVerificationUploadInput = z.infer<typeof sellerVerificationUploadSchema>;
export type SellerVerificationFlowSubmitInput = z.infer<typeof sellerVerificationFlowSubmitSchema>;
export type SellerVerificationReviewInput = z.infer<typeof sellerVerificationReviewSchema>;
export type SellerSuspendInput = z.infer<typeof sellerSuspendSchema>;
export type SellerLimitInput = z.infer<typeof sellerLimitSchema>;
export type SellerReverificationInput = z.infer<typeof sellerReverificationSchema>;
export type AdminSellerVerificationListInput = z.infer<typeof adminSellerVerificationListSchema>;
