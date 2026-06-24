import type { RbacRole } from '@community-marketplace/types';

import { getWebRoleFromCookie } from './auth';
import { useAuthStore } from '@/store/auth.store';

/** Client hook consumer — read authenticated user from the auth store. */
export function getClientUser() {
  return useAuthStore.getState().user;
}

/** Read role from middleware cookie (server) or document cookie (client). */
export function getUserRole(cookieHeader?: string): RbacRole | null {
  if (typeof window !== 'undefined') {
    const clientUser = getClientUser();
    if (clientUser?.role) return clientUser.role;
    return getWebRoleFromCookie(document.cookie);
  }
  return getWebRoleFromCookie(cookieHeader);
}
