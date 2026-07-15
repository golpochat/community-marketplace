import {
  ADMIN_PERSONA_DEFINITIONS,
  ADMIN_PERSONA_ROLE_CODES,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
  RBAC_ROLES,
  type AdminPersonaRoleCode,
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

export const ROLE_SEED = [
  ...RBAC_ROLES.map((code) => ({
    code,
    name: code
      .split('_')
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' '),
    description: `System role: ${code}`,
    isSystem: true,
  })),
  ...ADMIN_PERSONA_ROLE_CODES.map((code) => ({
    code,
    name: ADMIN_PERSONA_DEFINITIONS[code].label,
    description: ADMIN_PERSONA_DEFINITIONS[code].description,
    isSystem: true,
  })),
];

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

export const PERSONA_ROLE_PERMISSION_SEED: Readonly<
  Record<AdminPersonaRoleCode, readonly PermissionCode[]>
> = Object.fromEntries(
  ADMIN_PERSONA_ROLE_CODES.map((code) => [code, ADMIN_PERSONA_DEFINITIONS[code].permissions]),
) as Record<AdminPersonaRoleCode, readonly PermissionCode[]>;

/** Stable bootstrap super-admin user ID (development / staging seed). */
export const SUPER_ADMIN_BOOTSTRAP_USER_ID = '00000000-0000-4000-8000-000000000010';

export const SUPER_ADMIN_BOOTSTRAP_DEFAULTS = {
  email: 'superadmin@sellnearby.ie',
  displayName: 'Super Admin',
} as const;
