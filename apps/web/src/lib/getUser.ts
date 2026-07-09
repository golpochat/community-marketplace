import type { RoleCodeValue } from '@community-marketplace/types';

import { getWebRoleFromAuthTokenCookie, getWebRoleFromCookie } from './auth';
import { useAuthStore } from '@/store/auth.store';

/** Client hook consumer — read authenticated user from the auth store. */
export function getClientUser() {
  return useAuthStore.getState().user;
}

/** Read role from middleware cookie (server) or document cookie (client). */
export function getUserRole(cookieHeader?: string): RoleCodeValue | null {
  if (typeof window !== 'undefined') {
    const clientUser = getClientUser();
    if (clientUser?.role) return clientUser.role;
    return getWebRoleFromAuthTokenCookie(document.cookie) ?? getWebRoleFromCookie(document.cookie);
  }
  return getWebRoleFromAuthTokenCookie(cookieHeader) ?? getWebRoleFromCookie(cookieHeader);
}
