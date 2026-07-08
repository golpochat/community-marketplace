import { z } from 'zod';

import { phoneSchema } from './auth.schema';
import { sellerPersonalDetailsUpdateSchema } from './personal-details.schema';

const sellerVerificationLegacyStartSchema = z.discriminatedUnion('action', [
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

/** Empty body starts verification; legacy action payloads delegate to phone/status. */
export const sellerVerificationStartSchema = z.union([
  sellerVerificationLegacyStartSchema,
  z.object({}).strict(),
]);

export const sellerVerificationPhoneSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('send_otp'),
    phone: phoneSchema,
  }),
  z.object({
    action: z.literal('verify_otp'),
    phone: phoneSchema,
    code: z.string().min(4).max(8),
  }),
]);

export const sellerVerificationUploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  fileName: z.string().min(1).max(120).optional(),
});

/** Either request a presigned upload URL or persist an uploaded file path on the active request. */
export const sellerVerificationDocumentSchema = z.union([
  sellerVerificationUploadSchema,
  z.object({
    filePath: z.string().min(1).max(2048),
  }),
]);

export const sellerVerificationPersonalDetailsSchema = sellerPersonalDetailsUpdateSchema;

export const sellerVerificationFlowSubmitSchema = z.object({
  phoneNumber: phoneSchema.optional(),
  idDocumentPath: z.string().min(1).optional(),
  selfiePath: z.string().min(1).optional(),
  addressDocumentPath: z.string().min(1).optional(),
});

export const sellerVerificationReviewSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const sellerSuspendSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(1).max(500),
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

export const sellerReactivateSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

export const sellerForceReverifySchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

export type SellerVerificationPersonalDetailsInput = z.infer<
  typeof sellerVerificationPersonalDetailsSchema
>;
export type SellerVerificationStartInput = z.infer<typeof sellerVerificationStartSchema>;
export type SellerVerificationPhoneInput = z.infer<typeof sellerVerificationPhoneSchema>;
export type SellerVerificationUploadInput = z.infer<typeof sellerVerificationUploadSchema>;
export type SellerVerificationDocumentInput = z.infer<typeof sellerVerificationDocumentSchema>;
export type SellerVerificationFlowSubmitInput = z.infer<typeof sellerVerificationFlowSubmitSchema>;
export type SellerVerificationReviewInput = z.infer<typeof sellerVerificationReviewSchema>;
export type SellerSuspendInput = z.infer<typeof sellerSuspendSchema>;
export type SellerLimitInput = z.infer<typeof sellerLimitSchema>;
export type SellerReverificationInput = z.infer<typeof sellerReverificationSchema>;
export type SellerReactivateInput = z.infer<typeof sellerReactivateSchema>;
export type SellerForceReverifyInput = z.infer<typeof sellerForceReverifySchema>;
export type AdminSellerVerificationListInput = z.infer<typeof adminSellerVerificationListSchema>;
