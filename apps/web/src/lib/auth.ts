import type { RbacRole } from '@community-marketplace/types';

import {
  ROLE_COOKIE_NAME,
  clearWebRoleCookie,
  getWebRoleFromCookie,
  getWebRoleFromAuthTokenCookie,
  setWebRoleCookie,
  setWebAuthTokenCookie,
  setWebRefreshTokenCookie,
  clearWebAuthTokenCookie,
  clearWebRefreshTokenCookie,
} from './role-cookie';

export {
  ROLE_COOKIE_NAME,
  setWebRoleCookie,
  clearWebRoleCookie,
  getWebRoleFromCookie,
  getWebRoleFromAuthTokenCookie,
  setWebAuthTokenCookie,
  setWebRefreshTokenCookie,
  clearWebAuthTokenCookie,
  clearWebRefreshTokenCookie,
};

export function setAuthRoleCookie(role: RbacRole): void {
  setWebRoleCookie(role);
}

export function clearAuthRoleCookie(): void {
  clearWebRoleCookie();
}
