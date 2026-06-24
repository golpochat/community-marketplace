import type { RbacRole } from '@community-marketplace/types';

import { API_NAMESPACES } from './rbac-routes';

function ns(role: 'SUPER_ADMIN' | 'ADMIN') {
  return role === 'SUPER_ADMIN' ? API_NAMESPACES.SUPER_ADMIN : API_NAMESPACES.ADMIN;
}

export function moderationRoutes(role: 'SUPER_ADMIN' | 'ADMIN') {
  const base = `${ns(role)}/moderation`;
  return {
    reports: `${base}/reports`,
    report: (id: string) => `${base}/reports/${id}`,
    reportAction: (id: string) => `${base}/reports/${id}/actions`,
    reportAssign: (id: string) => `${base}/reports/${id}/assign`,
    reportNotes: (id: string) => `${base}/reports/${id}/notes`,
    bans: `${base}/bans`,
    appeals: `${base}/appeals`,
    appeal: (id: string) => `${base}/appeals/${id}`,
    auditLogs: `${base}/audit-logs`,
    analytics: `${base}/analytics`,
    actions: `${base}/actions`,
  };
}

export const ADMIN_API_ROUTES = {
  superAdmin: {
    me: `${API_NAMESPACES.SUPER_ADMIN}/me`,
    platform: `${API_NAMESPACES.SUPER_ADMIN}/platform`,
    settings: `${API_NAMESPACES.SUPER_ADMIN}/settings`,
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
      synonyms: `${API_NAMESPACES.SUPER_ADMIN}/search/synonyms`,
      stopWords: `${API_NAMESPACES.SUPER_ADMIN}/search/stop-words`,
      relevance: `${API_NAMESPACES.SUPER_ADMIN}/search/relevance`,
      reindexStatus: (type: string) => `${API_NAMESPACES.SUPER_ADMIN}/search/reindex/${type}/status`,
    },
  },
  admin: {
    me: `${API_NAMESPACES.ADMIN}/me`,
    stats: `${API_NAMESPACES.ADMIN}/stats`,
    users: `${API_NAMESPACES.ADMIN}/users`,
    user: (id: string) => `${API_NAMESPACES.ADMIN}/users/${id}`,
    userSuspend: `${API_NAMESPACES.ADMIN}/users/suspend`,
    userUnsuspend: (id: string) => `${API_NAMESPACES.ADMIN}/users/${id}/unsuspend`,
    userBan: `${API_NAMESPACES.ADMIN}/users/ban`,
    userUnban: (userId: string, banId: string) =>
      `${API_NAMESPACES.ADMIN}/users/${userId}/bans/${banId}/unban`,
    verificationsPending: `${API_NAMESPACES.ADMIN}/users/verifications/pending`,
    verificationApprove: (id: string) => `${API_NAMESPACES.ADMIN}/users/verifications/${id}/approve`,
    verificationReject: (id: string) => `${API_NAMESPACES.ADMIN}/users/verifications/${id}/reject`,
    userAuditLogs: `${API_NAMESPACES.ADMIN}/users/audit-logs`,
    listings: `${API_NAMESPACES.ADMIN}/listings`,
    listing: (id: string) => `${API_NAMESPACES.ADMIN}/listings/${id}`,
    listingBan: (id: string) => `${API_NAMESPACES.ADMIN}/listings/${id}/ban`,
    listingUnban: (id: string) => `${API_NAMESPACES.ADMIN}/listings/${id}/unban`,
    listingReports: `${API_NAMESPACES.ADMIN}/listings/reports`,
    suspendUser: `${API_NAMESPACES.ADMIN}/users/suspend`,
    actions: `${API_NAMESPACES.ADMIN}/actions`,
    audit: `${API_NAMESPACES.ADMIN}/audit`,
    payments: `${API_NAMESPACES.ADMIN}/payments`,
    payment: (id: string) => `${API_NAMESPACES.ADMIN}/payments/${id}`,
    paymentsLedger: `${API_NAMESPACES.ADMIN}/payments/ledger`,
    refundsPending: `${API_NAMESPACES.ADMIN}/payments/refunds/pending`,
    refundsApprove: `${API_NAMESPACES.ADMIN}/payments/refunds/approve`,
    disputes: `${API_NAMESPACES.ADMIN}/payments/disputes`,
    payoutsManual: `${API_NAMESPACES.ADMIN}/payments/payouts/manual`,
    search: {
      indexes: `${API_NAMESPACES.ADMIN}/search/indexes`,
      health: `${API_NAMESPACES.ADMIN}/search/health`,
      reindex: `${API_NAMESPACES.ADMIN}/search/reindex`,
      analytics: `${API_NAMESPACES.ADMIN}/search/analytics`,
      synonyms: `${API_NAMESPACES.ADMIN}/search/synonyms`,
      stopWords: `${API_NAMESPACES.ADMIN}/search/stop-words`,
      relevance: `${API_NAMESPACES.ADMIN}/search/relevance`,
      reindexStatus: (type: string) => `${API_NAMESPACES.ADMIN}/search/reindex/${type}/status`,
    },
    notifications: {
      send: `${API_NAMESPACES.ADMIN}/notifications/send`,
      broadcast: `${API_NAMESPACES.ADMIN}/notifications/broadcast`,
      templates: `${API_NAMESPACES.ADMIN}/notifications/templates`,
      providers: `${API_NAMESPACES.ADMIN}/notifications/providers`,
      logs: `${API_NAMESPACES.ADMIN}/notifications/logs`,
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

export function routesForRole(role?: RbacRole | null) {
  return role === 'SUPER_ADMIN' ? ADMIN_API_ROUTES.superAdmin : ADMIN_API_ROUTES.admin;
}
