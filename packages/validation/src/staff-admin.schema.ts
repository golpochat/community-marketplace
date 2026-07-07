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

export type StaffOperatorRoleInput = z.infer<typeof staffOperatorRoleSchema>;
export type UpdateStaffRoleInput = z.infer<typeof updateStaffRoleSchema>;
export type UpdateStaffStatusInput = z.infer<typeof updateStaffStatusSchema>;
