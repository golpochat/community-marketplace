import { z } from 'zod';

import { paginationSchema } from './common.schema';

export const moderationReportReasonSchema = z.enum([
  'fraud',
  'harassment',
  'spam',
  'inappropriate_content',
  'scams',
  'fake_listing',
]);

export const moderationReportStatusSchema = z.enum(['pending', 'reviewed', 'action_taken']);

export const moderationActionTypeSchema = z.enum([
  'warn',
  'suspend',
  'ban',
  'delete_listing',
  'delete_message',
]);

export const suspensionDurationSchema = z.enum(['hours_24', 'days_7', 'days_30', 'permanent']);

export const appealStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export const moderationReportTargetTypeSchema = z.enum(['user', 'listing', 'message']);

export const createReportSchema = z.object({
  reason: moderationReportReasonSchema,
  description: z.string().max(2000).optional(),
});

export const moderationReportUserSchema = createReportSchema.extend({
  targetUserId: z.string().uuid(),
});

export const moderationReportListingSchema = createReportSchema.extend({
  listingId: z.string().uuid(),
});

export const moderationReportMessageSchema = createReportSchema.extend({
  messageId: z.string().uuid(),
});

export const moderationReportFiltersSchema = paginationSchema.extend({
  status: moderationReportStatusSchema.optional(),
  reason: moderationReportReasonSchema.optional(),
  targetType: moderationReportTargetTypeSchema.optional(),
  adminId: z.string().uuid().optional(),
});

export const assignReportSchema = z.object({
  adminId: z.string().uuid(),
});

export const updateReportNotesSchema = z.object({
  notes: z.string().max(2000),
});

export const takeModerationActionSchema = z.object({
  actionType: moderationActionTypeSchema,
  suspensionDuration: suspensionDurationSchema.optional(),
  notes: z.string().max(2000).optional(),
  warnMessage: z.string().max(2000).optional(),
  autoHideListing: z.boolean().optional(),
});

export const submitAppealSchema = z
  .object({
    reportId: z.string().uuid().optional(),
    moderationActionId: z.string().uuid().optional(),
    message: z.string().min(10).max(2000),
  })
  .refine((data) => data.reportId || data.moderationActionId, {
    message: 'Either reportId or moderationActionId is required',
  });

export const reviewAppealSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminNotes: z.string().max(2000).optional(),
});

export const moderationAppealsQuerySchema = paginationSchema.extend({
  status: appealStatusSchema.optional(),
  userId: z.string().uuid().optional(),
});

export const moderationAnalyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional().default(30),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ModerationReportUserInput = z.infer<typeof moderationReportUserSchema>;
export type ModerationReportListingInput = z.infer<typeof moderationReportListingSchema>;
export type ModerationReportMessageInput = z.infer<typeof moderationReportMessageSchema>;
export type ModerationReportFiltersInput = z.infer<typeof moderationReportFiltersSchema>;
export type TakeModerationActionInput = z.infer<typeof takeModerationActionSchema>;
export type SubmitAppealInput = z.infer<typeof submitAppealSchema>;
export type ReviewAppealInput = z.infer<typeof reviewAppealSchema>;
export type ModerationAppealsQueryInput = z.infer<typeof moderationAppealsQuerySchema>;
