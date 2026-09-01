import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
  RBAC_ROLES,
  type PermissionCode,
  type RbacRole,
} from '@community-marketplace/types';

const PERMISSION_ACTION_PREFIXES = [
  'manage',
  'view',
  'create',
  'edit',
  'delete',
  'approve',
  'reject',
  'review',
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
] as const;

function parsePermissionCode(code: PermissionCode): { resource: string; action: string } {
  for (const action of PERMISSION_ACTION_PREFIXES) {
    const prefix = `${action}_`;
    if (code.startsWith(prefix)) {
      return { action, resource: code.slice(prefix.length) };
    }
  }
  return { action: 'manage', resource: code };
}

function formatPermissionName(code: PermissionCode): string {
  return code
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const ROLE_SEED = RBAC_ROLES.map((code) => ({
  code,
  name: code
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' '),
  description: `System role: ${code}`,
  isSystem: true,
}));

export const PERMISSION_SEED = Object.values(PERMISSIONS).map((code) => {
  const { resource, action } = parsePermissionCode(code);
  return {
    code,
    name: formatPermissionName(code),
    description: `Allows ${action.replace(/_/g, ' ')} on ${resource.replace(/_/g, ' ')}`,
    resource,
    action,
  };
});

export const ROLE_PERMISSION_SEED: Readonly<Record<RbacRole, readonly PermissionCode[]>> =
  DEFAULT_ROLE_PERMISSIONS;

/** Stable bootstrap super-admin user ID (development / staging seed). */
export const SUPER_ADMIN_BOOTSTRAP_USER_ID = '00000000-0000-4000-8000-000000000010';

export const SUPER_ADMIN_BOOTSTRAP_DEFAULTS = {
  email: 'superadmin@community.market',
  displayName: 'Super Admin',
} as const;
