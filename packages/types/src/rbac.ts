/**
 * Enterprise RBAC model — canonical role and permission definitions.
 * Business logic (guards, resolvers) lives in apps/api; not here.
 */

import { isAdminPersonaRoleCode } from './admin-persona-codes';

// ── Roles ─────────────────────────────────────────────────────────────────────

export const RBAC_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MEMBER', 'SELLER', 'BUYER'] as const;

/** System role codes (fixed at seed time). Custom roles use other uppercase codes. */
export type RbacRole = (typeof RBAC_ROLES)[number];

/** Alias for system role code. */
export type RoleCode = RbacRole;

/** Any role code stored in `roles.code`. */
export type RoleCodeValue = RbacRole | (string & {});

export function isSystemRoleCode(code: string): code is RbacRole {
  return (RBAC_ROLES as readonly string[]).includes(code);
}

export function isPrivilegedSystemRole(code: string): boolean {
  return code === 'SUPER_ADMIN' || code === 'ADMIN' || isAdminPersonaRoleCode(code);
}

/** Smart templates when creating a custom role. */
export const RBAC_ROLE_TEMPLATES = [
  {
    id: 'blank',
    label: 'Blank role',
    description: 'Start with no permissions — pick exactly what this role needs.',
  },
  {
    id: 'MEMBER',
    label: 'Marketplace member template',
    description: 'Default unified account — browse and purchase; selling is enabled after onboarding.',
  },
  {
    id: 'BUYER',
    label: 'Buyer template',
    description: 'Copy default buyer permissions (browse, purchase, chat).',
  },
  {
    id: 'SELLER',
    label: 'Seller template',
    description: 'Copy default seller permissions (listings, payments, chat).',
  },
  {
    id: 'ADMIN',
    label: 'Operations admin template',
    description: 'Copy admin permissions excluding privileged RBAC controls.',
  },
  {
    id: 'ACCOUNTS_ADMIN',
    label: 'Accounts admin persona',
    description: 'Users, verification, and seller onboarding permissions.',
  },
  {
    id: 'MODERATION_ADMIN',
    label: 'Moderation admin persona',
    description: 'Reports, listings, messages, and dispute resolution.',
  },
  {
    id: 'FINANCIAL_ADMIN',
    label: 'Financial admin persona',
    description: 'Payments, refunds, monetization, and financial reporting.',
  },
] as const;

export type RbacRoleTemplateId = (typeof RBAC_ROLE_TEMPLATES)[number]['id'];

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
  FAVORITE_LISTING: 'favorite_listing',
  REPORT_LISTING: 'report_listing',
  BAN_LISTING: 'ban_listing',

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
  REVIEW_SELLER_VERIFICATION: 'review_seller_verification',
  SUSPEND_SELLER: 'suspend_seller',
  REACTIVATE_SELLER: 'reactivate_seller',
  FORCE_REVERIFY_SELLER: 'force_reverify_seller',
  VIEW_SELLER_DOCUMENTS: 'view_seller_documents',
  MANAGE_SELLER_LIMITS: 'manage_seller_limits',

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
  MODERATE_CHAT: 'moderate_chat',
  MODERATE_MESSAGES: 'moderate_messages',
  VIEW_ANY_CONVERSATION: 'view_any_conversation',
  FLAG_MESSAGE: 'flag_message',
  BAN_FROM_CHAT: 'ban_from_chat',

  // Disputes
  RESOLVE_DISPUTES: 'resolve_disputes',
  VIEW_DISPUTES: 'view_disputes',

  // Fraud
  VIEW_FRAUD: 'view_fraud',
  MANAGE_FRAUD: 'manage_fraud',

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
  | 'review'
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
    PERMISSIONS.BAN_LISTING,
    PERMISSIONS.VIEW_LISTINGS,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.REFUND_PAYMENT,
    PERMISSIONS.APPROVE_VERIFICATION,
    PERMISSIONS.REJECT_VERIFICATION,
    PERMISSIONS.REVIEW_SELLER_VERIFICATION,
    PERMISSIONS.SUSPEND_SELLER,
    PERMISSIONS.REACTIVATE_SELLER,
    PERMISSIONS.FORCE_REVERIFY_SELLER,
    PERMISSIONS.VIEW_SELLER_DOCUMENTS,
    PERMISSIONS.MANAGE_SELLER_LIMITS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_REPORTS,
    PERMISSIONS.RESOLVE_REPORT,
    PERMISSIONS.MODERATE_CHAT,
    PERMISSIONS.MODERATE_MESSAGES,
    PERMISSIONS.VIEW_ANY_CONVERSATION,
    PERMISSIONS.FLAG_MESSAGE,
    PERMISSIONS.BAN_FROM_CHAT,
    PERMISSIONS.VIEW_DISPUTES,
    PERMISSIONS.RESOLVE_DISPUTES,
    PERMISSIONS.VIEW_FRAUD,
    PERMISSIONS.MANAGE_FRAUD,
    PERMISSIONS.SEND_NOTIFICATION,
    PERMISSIONS.MANAGE_NOTIFICATIONS,
    PERMISSIONS.MANAGE_SEARCH_INDEX,
    PERMISSIONS.REINDEX_SEARCH,
    PERMISSIONS.VIEW_PLATFORM_STATS,
    PERMISSIONS.VIEW_AUDIT_LOG,
    PERMISSIONS.EXECUTE_ADMIN_ACTION,
  ],

  /** Unified marketplace account — buyer permissions by default; seller perms via onboarding grant. */
  MEMBER: [
    PERMISSIONS.VIEW_LISTINGS,
    PERMISSIONS.PURCHASE_ITEM,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.LEAVE_REVIEW,
    PERMISSIONS.VIEW_REVIEWS,
    PERMISSIONS.SUBMIT_VERIFICATION,
    PERMISSIONS.SEND_MESSAGE,
    PERMISSIONS.VIEW_CONVERSATIONS,
    PERMISSIONS.FAVORITE_LISTING,
    PERMISSIONS.REPORT_LISTING,
  ],

  SELLER: [
    PERMISSIONS.CREATE_LISTING,
    PERMISSIONS.EDIT_LISTING,
    PERMISSIONS.DELETE_LISTING,
    PERMISSIONS.VIEW_LISTINGS,
    PERMISSIONS.RECEIVE_PAYMENT,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.PURCHASE_ITEM,
    PERMISSIONS.LEAVE_REVIEW,
    PERMISSIONS.VIEW_REVIEWS,
    PERMISSIONS.SUBMIT_VERIFICATION,
    PERMISSIONS.SEND_MESSAGE,
    PERMISSIONS.VIEW_CONVERSATIONS,
    PERMISSIONS.FAVORITE_LISTING,
    PERMISSIONS.REPORT_LISTING,
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
    PERMISSIONS.FAVORITE_LISTING,
    PERMISSIONS.REPORT_LISTING,
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
  code: RoleCodeValue;
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
