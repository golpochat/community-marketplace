import type { RbacRole, RoleCodeValue } from '@community-marketplace/types';
import { isAdminPersonaRoleCode } from '@community-marketplace/types';

export const ROLE_COOKIE_NAME = 'cm-role';

export function setWebRoleCookie(role: RoleCodeValue): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ROLE_COOKIE_NAME}=${role}; path=/; SameSite=Lax`;
}

export function clearWebRoleCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ROLE_COOKIE_NAME}=; path=/; max-age=0`;
}

export function getWebRoleFromCookie(cookieHeader: string | undefined): RoleCodeValue | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${ROLE_COOKIE_NAME}=([^;]+)`));
  const value = match?.[1];
  if (
    value === 'SELLER' ||
    value === 'BUYER' ||
    value === 'SUPER_ADMIN' ||
    value === 'ADMIN' ||
    isAdminPersonaRoleCode(value ?? '')
  ) {
    return value as RoleCodeValue;
  }
  return null;
}
