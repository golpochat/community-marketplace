import { PERMISSIONS, type PermissionCode } from './rbac';

export type RbacPermissionScopeId =
  | 'accounts'
  | 'financial'
  | 'moderation'
  | 'listings'
  | 'platform';

export interface RbacPermissionScopeDefinition {
  id: RbacPermissionScopeId;
  label: string;
  description: string;
  managementPermission: PermissionCode;
  permissions: readonly PermissionCode[];
}

/**
 * Scoped permission domains for delegated RBAC administration.
 * An ADMIN with e.g. MANAGE_FINANCIAL_PERMISSIONS can assign/remove permissions
 * within the `financial` scope on non-privileged roles (SELLER, BUYER).
 */
export const RBAC_PERMISSION_SCOPES: Record<RbacPermissionScopeId, RbacPermissionScopeDefinition> = {
  accounts: {
    id: 'accounts',
    label: 'Accounts Admin',
    description: 'User management, role assignment, and verification permissions',
    managementPermission: PERMISSIONS.MANAGE_ACCOUNTS_PERMISSIONS,
    permissions: [
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.SUSPEND_USER,
      PERMISSIONS.BAN_USER,
      PERMISSIONS.ASSIGN_ROLE,
      PERMISSIONS.ASSIGN_PERMISSION_OVERRIDE,
      PERMISSIONS.APPROVE_VERIFICATION,
      PERMISSIONS.REJECT_VERIFICATION,
      PERMISSIONS.REVIEW_SELLER_VERIFICATION,
      PERMISSIONS.SUSPEND_SELLER,
      PERMISSIONS.VIEW_SELLER_DOCUMENTS,
      PERMISSIONS.MANAGE_SELLER_LIMITS,
      PERMISSIONS.SUBMIT_VERIFICATION,
    ],
  },
  financial: {
    id: 'financial',
    label: 'Financial Admin',
    description: 'Payment and purchase-related permissions',
    managementPermission: PERMISSIONS.MANAGE_FINANCIAL_PERMISSIONS,
    permissions: [
      PERMISSIONS.MANAGE_PAYMENTS,
      PERMISSIONS.VIEW_PAYMENTS,
      PERMISSIONS.PURCHASE_ITEM,
      PERMISSIONS.RECEIVE_PAYMENT,
      PERMISSIONS.REFUND_PAYMENT,
    ],
  },
  moderation: {
    id: 'moderation',
    label: 'Moderation Admin',
    description: 'Reports, bans, and review moderation permissions',
    managementPermission: PERMISSIONS.MANAGE_MODERATION_PERMISSIONS,
    permissions: [
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.MANAGE_REPORTS,
      PERMISSIONS.RESOLVE_REPORT,
      PERMISSIONS.BAN_USER,
      PERMISSIONS.MANAGE_REVIEWS,
      PERMISSIONS.VIEW_REVIEWS,
      PERMISSIONS.LEAVE_REVIEW,
    ],
  },
  listings: {
    id: 'listings',
    label: 'Listings Admin',
    description: 'Listing lifecycle permissions',
    managementPermission: PERMISSIONS.MANAGE_LISTING_PERMISSIONS,
    permissions: [
      PERMISSIONS.MANAGE_LISTINGS,
      PERMISSIONS.CREATE_LISTING,
      PERMISSIONS.EDIT_LISTING,
      PERMISSIONS.DELETE_LISTING,
      PERMISSIONS.APPROVE_LISTING,
      PERMISSIONS.ARCHIVE_LISTING,
      PERMISSIONS.VIEW_LISTINGS,
    ],
  },
  platform: {
    id: 'platform',
    label: 'Platform Admin',
    description: 'Search, notifications, and platform operations',
    managementPermission: PERMISSIONS.MANAGE_PLATFORM_PERMISSIONS,
    permissions: [
      PERMISSIONS.MANAGE_SEARCH_INDEX,
      PERMISSIONS.REINDEX_SEARCH,
      PERMISSIONS.SEND_NOTIFICATION,
      PERMISSIONS.MANAGE_NOTIFICATIONS,
      PERMISSIONS.VIEW_PLATFORM_STATS,
      PERMISSIONS.VIEW_AUDIT_LOG,
      PERMISSIONS.EXECUTE_ADMIN_ACTION,
      PERMISSIONS.SEND_MESSAGE,
      PERMISSIONS.VIEW_CONVERSATIONS,
      PERMISSIONS.DELETE_MESSAGE,
    ],
  },
};

/** Permissions that only SUPER_ADMIN may assign (roles, admins, global RBAC) */
export const PRIVILEGED_PERMISSION_CODES: readonly PermissionCode[] = [
  PERMISSIONS.MANAGE_ADMINS,
  PERMISSIONS.MANAGE_ROLES,
  PERMISSIONS.MANAGE_PERMISSIONS,
  PERMISSIONS.MANAGE_ACCOUNTS_PERMISSIONS,
  PERMISSIONS.MANAGE_FINANCIAL_PERMISSIONS,
  PERMISSIONS.MANAGE_MODERATION_PERMISSIONS,
  PERMISSIONS.MANAGE_LISTING_PERMISSIONS,
  PERMISSIONS.MANAGE_PLATFORM_PERMISSIONS,
];

/** Roles whose permission sets may only be changed by SUPER_ADMIN */
export const PRIVILEGED_ROLE_CODES = ['SUPER_ADMIN', 'ADMIN'] as const;

export function getScopeForPermissionCode(
  code: PermissionCode,
): RbacPermissionScopeId | undefined {
  for (const scope of Object.values(RBAC_PERMISSION_SCOPES)) {
    if (scope.permissions.includes(code)) {
      return scope.id;
    }
  }
  return undefined;
}

export function getScopeById(scopeId: string): RbacPermissionScopeDefinition | undefined {
  return RBAC_PERMISSION_SCOPES[scopeId as RbacPermissionScopeId];
}
