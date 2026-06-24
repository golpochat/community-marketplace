import { API_NAMESPACES } from './rbac-routes';

export function moderationRoutes(role: 'SUPER_ADMIN' | 'ADMIN') {
  const prefix = role === 'SUPER_ADMIN' ? API_NAMESPACES.SUPER_ADMIN : API_NAMESPACES.ADMIN;
  return {
    reports: `${prefix}/moderation/reports`,
    bans: `${prefix}/moderation/bans`,
  };
}

export const ADMIN_API_ROUTES = {
  superAdmin: {
    platform: `${API_NAMESPACES.SUPER_ADMIN}/platform`,
    roles: `${API_NAMESPACES.SUPER_ADMIN}/roles`,
    permissions: `${API_NAMESPACES.SUPER_ADMIN}/permissions`,
    roleMatrix: `${API_NAMESPACES.SUPER_ADMIN}/roles/matrix`,
    assignRole: `${API_NAMESPACES.SUPER_ADMIN}/users/assign-role`,
    removeRole: (userId: string) => `${API_NAMESPACES.SUPER_ADMIN}/users/${userId}/role`,
    rolePermissions: (roleId: string) =>
      `${API_NAMESPACES.SUPER_ADMIN}/roles/${roleId}/permissions`,
    assignPermissionOverride: `${API_NAMESPACES.SUPER_ADMIN}/users/permission-overrides`,
    userPermissionOverrides: (userId: string) =>
      `${API_NAMESPACES.SUPER_ADMIN}/users/${userId}/permission-overrides`,
    revokePermissionOverride: (userId: string, permissionId: string) =>
      `${API_NAMESPACES.SUPER_ADMIN}/users/${userId}/permission-overrides/${permissionId}`,
    effectivePermissions: (userId: string) =>
      `${API_NAMESPACES.SUPER_ADMIN}/users/${userId}/effective-permissions`,
    admins: `${API_NAMESPACES.SUPER_ADMIN}/admins`,
    audit: `${API_NAMESPACES.SUPER_ADMIN}/audit`,
    actions: `${API_NAMESPACES.SUPER_ADMIN}/actions`,
    stats: `${API_NAMESPACES.SUPER_ADMIN}/stats`,
    users: `${API_NAMESPACES.SUPER_ADMIN}/users`,
    listings: `${API_NAMESPACES.SUPER_ADMIN}/listings`,
    search: {
      indexes: `${API_NAMESPACES.SUPER_ADMIN}/search/indexes`,
      health: `${API_NAMESPACES.SUPER_ADMIN}/search/health`,
      reindex: `${API_NAMESPACES.SUPER_ADMIN}/search/reindex`,
      analytics: `${API_NAMESPACES.SUPER_ADMIN}/search/analytics`,
      reindexStatus: (type: string) => `${API_NAMESPACES.SUPER_ADMIN}/search/reindex/${type}/status`,
    },
  },
  admin: {
    stats: `${API_NAMESPACES.ADMIN}/stats`,
    users: `${API_NAMESPACES.ADMIN}/users`,
    listings: `${API_NAMESPACES.ADMIN}/listings`,
    suspendUser: `${API_NAMESPACES.ADMIN}/users/suspend`,
    approveListing: (id: string) => `${API_NAMESPACES.ADMIN}/listings/${id}/approve`,
    actions: `${API_NAMESPACES.ADMIN}/actions`,
    audit: `${API_NAMESPACES.ADMIN}/audit`,
    moderation: {
      reports: `${API_NAMESPACES.ADMIN}/moderation/reports`,
      bans: `${API_NAMESPACES.ADMIN}/moderation/bans`,
    },
    search: {
      indexes: `${API_NAMESPACES.ADMIN}/search/indexes`,
      health: `${API_NAMESPACES.ADMIN}/search/health`,
      reindex: `${API_NAMESPACES.ADMIN}/search/reindex`,
      analytics: `${API_NAMESPACES.ADMIN}/search/analytics`,
      reindexStatus: (type: string) => `${API_NAMESPACES.ADMIN}/search/reindex/${type}/status`,
    },
    notifications: {
      send: `${API_NAMESPACES.ADMIN}/notifications/send`,
    },
    rbac: {
      scopes: `${API_NAMESPACES.ADMIN}/rbac/scopes`,
      roles: `${API_NAMESPACES.ADMIN}/rbac/roles`,
      permissions: `${API_NAMESPACES.ADMIN}/rbac/permissions`,
      rolePermissions: (roleId: string) => `${API_NAMESPACES.ADMIN}/rbac/roles/${roleId}/permissions`,
      assignRole: `${API_NAMESPACES.ADMIN}/rbac/users/assign-role`,
      removeRole: (userId: string) => `${API_NAMESPACES.ADMIN}/rbac/users/${userId}/role`,
      assignPermissionOverride: `${API_NAMESPACES.ADMIN}/rbac/users/permission-overrides`,
      userPermissionOverrides: (userId: string) =>
        `${API_NAMESPACES.ADMIN}/rbac/users/${userId}/permission-overrides`,
      revokePermissionOverride: (userId: string, permissionId: string) =>
        `${API_NAMESPACES.ADMIN}/rbac/users/${userId}/permission-overrides/${permissionId}`,
      effectivePermissions: (userId: string) =>
        `${API_NAMESPACES.ADMIN}/rbac/users/${userId}/effective-permissions`,
    },
  },
} as const;
