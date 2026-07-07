import { PERMISSIONS, type PermissionCode } from './rbac';
import { RBAC_PERMISSION_SCOPES } from './rbac-scopes';
import type { AdminPersonaRoleCode } from './admin-persona-codes';

export type { AdminPersonaRoleCode } from './admin-persona-codes';
export {
  ADMIN_PERSONA_ROLE_CODES,
  isAdminPersonaRoleCode,
  isAdminPanelRoleCode,
} from './admin-persona-codes';

export interface AdminPersonaDefinition {
  code: AdminPersonaRoleCode;
  slug: string;
  label: string;
  description: string;
  permissions: readonly PermissionCode[];
}

function uniquePermissions(codes: PermissionCode[]): PermissionCode[] {
  return [...new Set(codes)];
}

export const ADMIN_PERSONA_DEFINITIONS: Record<AdminPersonaRoleCode, AdminPersonaDefinition> = {
  ACCOUNTS_ADMIN: {
    code: 'ACCOUNTS_ADMIN',
    slug: 'accounts-admin',
    label: 'Accounts Admin',
    description: 'User management, account verification, and seller verification.',
    permissions: uniquePermissions([
      ...RBAC_PERMISSION_SCOPES.accounts.permissions,
      PERMISSIONS.REACTIVATE_SELLER,
      PERMISSIONS.FORCE_REVERIFY_SELLER,
      PERMISSIONS.EXECUTE_ADMIN_ACTION,
      PERMISSIONS.VIEW_PLATFORM_STATS,
    ]),
  },
  MODERATION_ADMIN: {
    code: 'MODERATION_ADMIN',
    slug: 'moderation-admin',
    label: 'Moderation Admin',
    description: 'Reports, listing moderation, message moderation, and dispute resolution.',
    permissions: uniquePermissions([
      ...RBAC_PERMISSION_SCOPES.moderation.permissions,
      PERMISSIONS.MANAGE_LISTINGS,
      PERMISSIONS.APPROVE_LISTING,
      PERMISSIONS.ARCHIVE_LISTING,
      PERMISSIONS.VIEW_LISTINGS,
      PERMISSIONS.BAN_LISTING,
      PERMISSIONS.MODERATE_CHAT,
      PERMISSIONS.MODERATE_MESSAGES,
      PERMISSIONS.VIEW_ANY_CONVERSATION,
      PERMISSIONS.FLAG_MESSAGE,
      PERMISSIONS.BAN_FROM_CHAT,
      PERMISSIONS.VIEW_DISPUTES,
      PERMISSIONS.RESOLVE_DISPUTES,
      PERMISSIONS.EXECUTE_ADMIN_ACTION,
      PERMISSIONS.VIEW_PLATFORM_STATS,
    ]),
  },
  FINANCIAL_ADMIN: {
    code: 'FINANCIAL_ADMIN',
    slug: 'financial-admin',
    label: 'Financial Admin',
    description: 'Payments, refunds, monetization, and financial reporting.',
    permissions: uniquePermissions([
      ...RBAC_PERMISSION_SCOPES.financial.permissions,
      PERMISSIONS.EXECUTE_ADMIN_ACTION,
      PERMISSIONS.VIEW_PLATFORM_STATS,
    ]),
  },
};

// Re-export for consumers that import persona definitions only.