/**
 * Enterprise RBAC model — canonical role and permission definitions.
 * Business logic (guards, resolvers) lives in apps/api; not here.
 */

// ── Roles ─────────────────────────────────────────────────────────────────────

export const RBAC_ROLES = ['SUPER_ADMIN', 'ADMIN', 'SELLER', 'BUYER'] as const;

/** System role code — aligns with Prisma `RbacRoleCode`. */
export type RbacRole = (typeof RBAC_ROLES)[number];

/** Alias for role code enum (Prisma `RbacRoleCode`). */
export type RoleCode = RbacRole;

/** @deprecated Use RbacRole or RoleCode — alias kept for gradual migration */
export type UserRole = RbacRole;

// ── Permission catalog ────────────────────────────────────────────────────────

export const PERMISSIONS = {
  // Users
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  SUSPEND_USER: 'suspend_user',
  BAN_USER: 'ban_user',

  // Admins & RBAC
  MANAGE_ADMINS: 'manage_admins',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_PERMISSIONS: 'manage_permissions',
  ASSIGN_ROLE: 'assign_role',
  ASSIGN_PERMISSION_OVERRIDE: 'assign_permission_override',

  // Scoped RBAC delegation (ADMIN personas)
  MANAGE_ACCOUNTS_PERMISSIONS: 'manage_accounts_permissions',
  MANAGE_FINANCIAL_PERMISSIONS: 'manage_financial_permissions',
  MANAGE_MODERATION_PERMISSIONS: 'manage_moderation_permissions',
  MANAGE_LISTING_PERMISSIONS: 'manage_listing_permissions',
  MANAGE_PLATFORM_PERMISSIONS: 'manage_platform_permissions',

  // Listings
  MANAGE_LISTINGS: 'manage_listings',
  CREATE_LISTING: 'create_listing',
  EDIT_LISTING: 'edit_listing',
  DELETE_LISTING: 'delete_listing',
  APPROVE_LISTING: 'approve_listing',
  ARCHIVE_LISTING: 'archive_listing',
  VIEW_LISTINGS: 'view_listings',

  // Payments
  MANAGE_PAYMENTS: 'manage_payments',
  VIEW_PAYMENTS: 'view_payments',
  PURCHASE_ITEM: 'purchase_item',
  RECEIVE_PAYMENT: 'receive_payment',
  REFUND_PAYMENT: 'refund_payment',

  // Verification
  APPROVE_VERIFICATION: 'approve_verification',
  REJECT_VERIFICATION: 'reject_verification',
  SUBMIT_VERIFICATION: 'submit_verification',

  // Moderation
  VIEW_REPORTS: 'view_reports',
  MANAGE_REPORTS: 'manage_reports',
  RESOLVE_REPORT: 'resolve_report',

  // Reviews
  LEAVE_REVIEW: 'leave_review',
  VIEW_REVIEWS: 'view_reviews',
  MANAGE_REVIEWS: 'manage_reviews',

  // Chat
  SEND_MESSAGE: 'send_message',
  VIEW_CONVERSATIONS: 'view_conversations',
  DELETE_MESSAGE: 'delete_message',

  // Notifications
  SEND_NOTIFICATION: 'send_notification',
  MANAGE_NOTIFICATIONS: 'manage_notifications',

  // Search
  MANAGE_SEARCH_INDEX: 'manage_search_index',
  REINDEX_SEARCH: 'reindex_search',

  // Platform admin
  VIEW_PLATFORM_STATS: 'view_platform_stats',
  VIEW_AUDIT_LOG: 'view_audit_log',
  EXECUTE_ADMIN_ACTION: 'execute_admin_action',
} as const;

/** Permission code — aligns with `permissions.code` in the database. */
export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_CODES = Object.values(PERMISSIONS) as PermissionCode[];

export type PermissionResource =
  | 'users'
  | 'admins'
  | 'roles'
  | 'listings'
  | 'payments'
  | 'verification'
  | 'moderation'
  | 'reviews'
  | 'chat'
  | 'notifications'
  | 'search'
  | 'platform';

export type PermissionAction =
  | 'manage'
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'ban'
  | 'suspend'
  | 'purchase'
  | 'receive'
  | 'refund'
  | 'send'
  | 'resolve'
  | 'archive'
  | 'reindex'
  | 'execute'
  | 'submit'
  | 'leave';

// ── Default role → permission matrix (seed / documentation reference) ───────────

export const DEFAULT_ROLE_PERMISSIONS: Readonly<Record<RbacRole, readonly PermissionCode[]>> = {
  SUPER_ADMIN: PERMISSION_CODES,

  ADMIN: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.SUSPEND_USER,
    PERMISSIONS.BAN_USER,
    PERMISSIONS.MANAGE_LISTINGS,
    PERMISSIONS.APPROVE_LISTING,
    PERMISSIONS.ARCHIVE_LISTING,
    PERMISSIONS.VIEW_LISTINGS,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.APPROVE_VERIFICATION,
    PERMISSIONS.REJECT_VERIFICATION,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_REPORTS,
    PERMISSIONS.RESOLVE_REPORT,
    PERMISSIONS.SEND_NOTIFICATION,
    PERMISSIONS.MANAGE_NOTIFICATIONS,
    PERMISSIONS.MANAGE_SEARCH_INDEX,
    PERMISSIONS.REINDEX_SEARCH,
    PERMISSIONS.VIEW_PLATFORM_STATS,
    PERMISSIONS.VIEW_AUDIT_LOG,
    PERMISSIONS.EXECUTE_ADMIN_ACTION,
  ],

  SELLER: [
    PERMISSIONS.CREATE_LISTING,
    PERMISSIONS.EDIT_LISTING,
    PERMISSIONS.DELETE_LISTING,
    PERMISSIONS.VIEW_LISTINGS,
    PERMISSIONS.RECEIVE_PAYMENT,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.SUBMIT_VERIFICATION,
    PERMISSIONS.SEND_MESSAGE,
    PERMISSIONS.VIEW_CONVERSATIONS,
  ],

  BUYER: [
    PERMISSIONS.VIEW_LISTINGS,
    PERMISSIONS.PURCHASE_ITEM,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.LEAVE_REVIEW,
    PERMISSIONS.VIEW_REVIEWS,
    PERMISSIONS.SUBMIT_VERIFICATION,
    PERMISSIONS.SEND_MESSAGE,
    PERMISSIONS.VIEW_CONVERSATIONS,
  ],
};

// ── Permission override effect ────────────────────────────────────────────────

export const PERMISSION_EFFECTS = ['GRANT', 'DENY'] as const;

export type PermissionEffect = (typeof PERMISSION_EFFECTS)[number];

// ── Entity interfaces ─────────────────────────────────────────────────────────

export interface Permission {
  id: string;
  code: PermissionCode;
  name: string;
  description?: string;
  resource: PermissionResource;
  action: PermissionAction;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  /** Roles that include this permission (when loaded with relations). */
  roles?: Role[];
}

export interface Role {
  id: string;
  code: RbacRole;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  /** Default permissions granted by this role (when loaded with relations). */
  permissions?: Permission[];
  rolePermissions?: RolePermission[];
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
  createdAt: string;
  role?: Role;
  permission?: Permission;
}

export interface UserPermission {
  id: string;
  userId: string;
  permissionId: string;
  effect: PermissionEffect;
  reason?: string;
  grantedBy?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  permission?: Permission;
  grantedByUser?: { id: string; email: string; displayName?: string };
}

/** Role with its default permission set (API detail / admin views). */
export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

/** Effective permission set for a user (resolved shape — populated by API layer). */
export interface UserEffectivePermissions {
  userId: string;
  primaryRole: RbacRole;
  primaryRoleId: string;
  rolePermissions: PermissionCode[];
  grantedOverrides: PermissionCode[];
  deniedOverrides: PermissionCode[];
  effective: PermissionCode[];
}
