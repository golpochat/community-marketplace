import type { RbacRole } from '@community-marketplace/types';

import {
  ROLE_COOKIE_NAME,
  clearWebRoleCookie,
  getWebRoleFromCookie,
  setWebRoleCookie,
} from './role-cookie';

export {
  ROLE_COOKIE_NAME,
  setWebRoleCookie,
  clearWebRoleCookie,
  getWebRoleFromCookie,
};

export function setAuthRoleCookie(role: RbacRole): void {
  setWebRoleCookie(role);
}

export function clearAuthRoleCookie(): void {
  clearWebRoleCookie();
}
