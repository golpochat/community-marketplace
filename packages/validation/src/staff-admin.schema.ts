import { z } from 'zod';

import {
  ADMIN_PERSONA_ROLE_CODES,
  STAFF_ROLE_CHANGE_REASONS,
  STAFF_STATUS_CHANGE_REASONS,
} from '@community-marketplace/types';

import { uuidSchema } from './common.schema';

export const staffOperatorRoleSchema = z.enum(['ADMIN', ...ADMIN_PERSONA_ROLE_CODES]);

export const staffRoleChangeReasonSchema = z.enum(STAFF_ROLE_CHANGE_REASONS);

export const staffStatusChangeReasonSchema = z.enum(STAFF_STATUS_CHANGE_REASONS);

export const updateStaffRoleSchema = z.object({
  role: staffOperatorRoleSchema,
  reason: staffRoleChangeReasonSchema,
  reasonDetail: z.string().max(500).optional(),
});

export const updateStaffStatusSchema = z.object({
  status: z.enum(['active', 'inactive']),
  reason: staffStatusChangeReasonSchema,
  reasonDetail: z.string().max(500).optional(),
});

export const staffAdminUserIdSchema = z.object({
  userId: uuidSchema,
});

export const adminActionSchema = z.object({
  action: z.enum([
    'user_suspend',
    'user_activate',
    'listing_approve',
    'listing_reject',
    'ban_create',
    'ban_lift',
    'report_resolve',
  ]),
  targetType: z.string().min(1),
  targetId: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

export const superAdminActionSchema = z.object({
  action: z.string().min(1),
  targetType: z.string().min(1),
  targetId: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

export const createAdminSchema = z.object({
  email: z.string().email(),
});

export const createAdminInvitationSchema = z.object({
  email: z.string().email(),
  displayName: z.string().trim().min(1),
  roleId: uuidSchema,
});

export const adminInvitationTokenSchema = z.object({
  token: z.string().min(1),
});

export const acceptAdminInvitationSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export const legacyCreateReportSchema = z.object({
  targetType: z.enum(['listing', 'user', 'message']),
  targetId: z.string().min(1),
  reason: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
});

export type StaffOperatorRoleInput = z.infer<typeof staffOperatorRoleSchema>;
export type UpdateStaffRoleInput = z.infer<typeof updateStaffRoleSchema>;
export type UpdateStaffStatusInput = z.infer<typeof updateStaffStatusSchema>;
export type AdminActionInput = z.infer<typeof adminActionSchema>;
export type SuperAdminActionInput = z.infer<typeof superAdminActionSchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type CreateAdminInvitationInput = z.infer<typeof createAdminInvitationSchema>;
export type AdminInvitationTokenInput = z.infer<typeof adminInvitationTokenSchema>;
export type AcceptAdminInvitationInput = z.infer<typeof acceptAdminInvitationSchema>;
export type LegacyCreateReportInput = z.infer<typeof legacyCreateReportSchema>;
