import { z } from 'zod';

import { emailSchema, isoDateSchema, passwordSchema, uuidSchema } from './common.schema';
import { phoneSchema } from './auth.schema';
import {
  rbacRoleSchema,
  roleSchema,
  userEffectivePermissionsSchema,
  userPermissionSchema,
} from './rbac.schema';

/** @deprecated Use rbacRoleSchema */
export const userRoleSchema = rbacRoleSchema;

export const userStatusSchema = z.enum(['active', 'inactive', 'suspended']);

export const userGenderSchema = z.enum(['male', 'female', 'other', 'prefer_not_to_say']);

export const verificationStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export const userLocationSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  label: z.string().max(120).optional(),
});

export const userSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  primaryRoleId: uuidSchema,
  role: rbacRoleSchema,
  status: userStatusSchema,
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  profileCompleted: z.boolean(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const userProfileSchema = userSchema.extend({
  bio: z.string().max(500).optional(),
  address: z.string().max(255).optional(),
  location: userLocationSchema.optional(),
  phone: phoneSchema.optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: userGenderSchema.optional(),
  verificationStatus: verificationStatusSchema.optional(),
  verificationBadge: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  address: z.string().max(255).optional(),
  location: userLocationSchema.optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: userGenderSchema.optional(),
});

export const completeProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
  phone: phoneSchema.optional(),
  bio: z.string().max(500).optional(),
  address: z.string().max(255).optional(),
  location: userLocationSchema.optional(),
});

export const sellerVerificationSubmitSchema = z.object({
  idDocumentFrontUrl: z.string().url(),
  idDocumentBackUrl: z.string().url(),
  selfieUrl: z.string().url(),
  addressProofUrl: z.string().url(),
});

export const verificationReviewSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const notificationPreferencesSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  inApp: z.boolean().optional(),
  sms: z.boolean().optional(),
  marketing: z.boolean().optional(),
  listingUpdates: z.boolean().optional(),
  messageAlerts: z.boolean().optional(),
  events: z.record(z.string(), z.boolean()).optional(),
});

export const privacySettingsSchema = z.object({
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showLocation: z.boolean().optional(),
  profileVisibility: z.enum(['public', 'members', 'private']).optional(),
});

export const communicationPreferencesSchema = z.object({
  preferredChannel: z.enum(['email', 'sms', 'push']).optional(),
  language: z.string().min(2).max(10).optional(),
  timezone: z.string().max(60).optional(),
});

export const updateUserSettingsSchema = z.object({
  notificationPreferences: notificationPreferencesSchema.optional(),
  privacySettings: privacySettingsSchema.optional(),
  communicationPreferences: communicationPreferencesSchema.optional(),
});

export const avatarUploadRequestSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  fileName: z.string().min(1).max(120).optional(),
});

export const verificationDocumentUploadRequestSchema = z.object({
  contentType: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]),
  fileName: z.string().min(1).max(120).optional(),
});

export const confirmAvatarSchema = z.object({
  publicUrl: z.string().url(),
});

export const adminUserListQuerySchema = z.object({
  role: rbacRoleSchema.optional(),
  status: userStatusSchema.optional(),
  verificationStatus: verificationStatusSchema.optional(),
  search: z.string().max(120).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const suspendUserSchema = z.object({
  userId: uuidSchema,
  reason: z.string().max(500).optional(),
});

export const banUserSchema = z.object({
  userId: uuidSchema,
  type: z.enum(['temporary', 'permanent']),
  reason: z.string().max(500).optional(),
  expiresAt: isoDateSchema.optional(),
});

export const userWithRoleSchema = userSchema.extend({
  primaryRole: roleSchema.optional(),
});

export const userWithPermissionsSchema = userWithRoleSchema.extend({
  permissionOverrides: z.array(userPermissionSchema).optional(),
  effectivePermissions: userEffectivePermissionsSchema.optional(),
});

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().min(1).max(100).optional(),
  role: rbacRoleSchema.default('BUYER'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type UserInput = z.infer<typeof userSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
export type SellerVerificationSubmitInput = z.infer<typeof sellerVerificationSubmitSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
export type AdminUserListQueryInput = z.infer<typeof adminUserListQuerySchema>;
export type UserWithRoleInput = z.infer<typeof userWithRoleSchema>;
export type UserWithPermissionsInput = z.infer<typeof userWithPermissionsSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
