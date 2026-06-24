import type { RbacRole } from '@community-marketplace/types';

export const ROLE_COOKIE_NAME = 'cm-admin-role';

export function setAdminRoleCookie(role: RbacRole): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ROLE_COOKIE_NAME}=${role}; path=/; SameSite=Lax`;
}

export function clearAdminRoleCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ROLE_COOKIE_NAME}=; path=/; max-age=0`;
}

export function getAdminRoleFromCookie(cookieHeader: string | undefined): RbacRole | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${ROLE_COOKIE_NAME}=([^;]+)`));
  const value = match?.[1];
  if (value === 'SUPER_ADMIN' || value === 'ADMIN') return value;
  return null;
}
