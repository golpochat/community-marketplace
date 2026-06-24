import { z } from 'zod';

import { emailSchema, isoDateSchema, passwordSchema, uuidSchema } from './common.schema';
import {
  rbacRoleSchema,
  roleSchema,
  userEffectivePermissionsSchema,
  userPermissionSchema,
} from './rbac.schema';

/** @deprecated Use rbacRoleSchema */
export const userRoleSchema = rbacRoleSchema;

export const userStatusSchema = z.enum(['active', 'inactive', 'suspended']);

export const userSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  primaryRoleId: uuidSchema,
  role: rbacRoleSchema,
  status: userStatusSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const userProfileSchema = userSchema.extend({
  bio: z.string().max(500).optional(),
  location: z.string().max(120).optional(),
  phone: z.string().max(20).optional(),
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
export type UserWithRoleInput = z.infer<typeof userWithRoleSchema>;
export type UserWithPermissionsInput = z.infer<typeof userWithPermissionsSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
