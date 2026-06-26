import { z } from 'zod';

import {
  PERMISSION_CODES,
  PERMISSION_EFFECTS,
  RBAC_ROLES,
} from '@community-marketplace/types';

import { emailSchema, isoDateSchema, uuidSchema } from './common.schema';

// ── Primitives ────────────────────────────────────────────────────────────────

export const rbacRoleSchema = z.enum(RBAC_ROLES);

export const permissionCodeSchema = z.enum(
  PERMISSION_CODES as [string, ...string[]],
);

export const permissionEffectSchema = z.enum(PERMISSION_EFFECTS);

export const permissionResourceSchema = z.enum([
  'users',
  'admins',
  'roles',
  'listings',
  'payments',
  'verification',
  'moderation',
  'reviews',
  'chat',
  'notifications',
  'search',
  'platform',
]);

export const permissionActionSchema = z.enum([
  'manage',
  'view',
  'create',
  'edit',
  'delete',
  'approve',
  'reject',
  'assign',
  'ban',
  'suspend',
  'purchase',
  'receive',
  'refund',
  'send',
  'resolve',
  'archive',
  'reindex',
  'execute',
  'submit',
  'leave',
]);

// ── Entity schemas ────────────────────────────────────────────────────────────

export const permissionSchema = z.object({
  id: uuidSchema,
  code: permissionCodeSchema,
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  resource: permissionResourceSchema,
  action: permissionActionSchema,
  isSystem: z.boolean(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const roleSchema = z.object({
  id: uuidSchema,
  code: rbacRoleSchema,
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  isSystem: z.boolean(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const rolePermissionSchema = z.object({
  roleId: uuidSchema,
  permissionId: uuidSchema,
  createdAt: isoDateSchema,
  role: roleSchema.optional(),
  permission: permissionSchema.optional(),
});

export const roleWithPermissionsSchema = roleSchema.extend({
  permissions: z.array(permissionSchema),
  rolePermissions: z.array(rolePermissionSchema).optional(),
});

export const userPermissionSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  permissionId: uuidSchema,
  effect: permissionEffectSchema,
  reason: z.string().max(500).optional(),
  grantedBy: uuidSchema.optional(),
  expiresAt: isoDateSchema.optional(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  permission: permissionSchema.optional(),
  grantedByUser: z
    .object({
      id: uuidSchema,
      email: emailSchema,
      displayName: z.string().min(1).max(100).optional(),
    })
    .optional(),
});

export const userEffectivePermissionsSchema = z.object({
  userId: uuidSchema,
  primaryRole: rbacRoleSchema,
  primaryRoleId: uuidSchema,
  rolePermissions: z.array(permissionCodeSchema),
  grantedOverrides: z.array(permissionCodeSchema),
  deniedOverrides: z.array(permissionCodeSchema),
  effective: z.array(permissionCodeSchema),
});

// ── Request / command payloads ────────────────────────────────────────────────

export const createRoleSchema = z.object({
  name: z.string().min(2).max(80),
  code: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Use uppercase letters, numbers, and underscores')
    .optional(),
  description: z.string().max(500).optional(),
  template: z.enum(['blank', 'BUYER', 'SELLER', 'ADMIN']).default('blank'),
});

/** @deprecated System-only — use createRoleSchema for custom roles */
export const createSystemRoleSchema = z.object({
  code: rbacRoleSchema,
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
});

export const updateRoleSchema = createRoleSchema
  .pick({ name: true, description: true })
  .partial();

export const createPermissionSchema = z.object({
  code: permissionCodeSchema,
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  resource: permissionResourceSchema,
  action: permissionActionSchema,
});

export const syncRolePermissionsSchema = z.object({
  roleId: uuidSchema,
  permissionIds: z.array(uuidSchema).min(1),
});

export const assignRoleSchema = z.object({
  userId: uuidSchema,
  roleId: uuidSchema,
  reason: z.string().max(500).optional(),
});

export const assignPermissionOverrideSchema = z.object({
  userId: uuidSchema,
  permissionId: uuidSchema,
  effect: permissionEffectSchema,
  reason: z.string().max(500).optional(),
  expiresAt: isoDateSchema.optional(),
});

export const revokePermissionOverrideSchema = z.object({
  userId: uuidSchema,
  permissionId: uuidSchema,
});

export const checkPermissionSchema = z.object({
  userId: uuidSchema,
  permission: permissionCodeSchema,
});

export const addRolePermissionSchema = z.object({
  permissionId: uuidSchema,
});

export const syncRolePermissionsByIdSchema = z.object({
  permissionIds: z.array(uuidSchema),
});

export const removeUserRoleSchema = z.object({
  fallbackRoleId: uuidSchema.optional(),
});

export const listPermissionsQuerySchema = z.object({
  scope: z.string().optional(),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type RbacRoleInput = z.infer<typeof rbacRoleSchema>;
export type PermissionCodeInput = z.infer<typeof permissionCodeSchema>;
export type PermissionInput = z.infer<typeof permissionSchema>;
export type RoleInput = z.infer<typeof roleSchema>;
export type RolePermissionInput = z.infer<typeof rolePermissionSchema>;
export type RoleWithPermissionsInput = z.infer<typeof roleWithPermissionsSchema>;
export type UserPermissionInput = z.infer<typeof userPermissionSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type SyncRolePermissionsInput = z.infer<typeof syncRolePermissionsSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type AssignPermissionOverrideInput = z.infer<typeof assignPermissionOverrideSchema>;
export type RevokePermissionOverrideInput = z.infer<typeof revokePermissionOverrideSchema>;
export type CheckPermissionInput = z.infer<typeof checkPermissionSchema>;
export type AddRolePermissionInput = z.infer<typeof addRolePermissionSchema>;
export type SyncRolePermissionsByIdInput = z.infer<typeof syncRolePermissionsByIdSchema>;
export type RemoveUserRoleInput = z.infer<typeof removeUserRoleSchema>;
export type ListPermissionsQueryInput = z.infer<typeof listPermissionsQuerySchema>;
