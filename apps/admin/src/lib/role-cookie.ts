import type { RbacRole } from '@community-marketplace/types';

export const ROLE_COOKIE_NAME = 'cm-admin-role';
export const AUTH_TOKEN_COOKIE_NAME = 'cm-admin-token';

export function setAdminRoleCookie(role: RbacRole): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ROLE_COOKIE_NAME}=${role}; path=/; SameSite=Lax`;
}

export function setAdminAuthTokenCookie(token: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
}

export function clearAdminRoleCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ROLE_COOKIE_NAME}=; path=/; max-age=0`;
}

export function clearAdminAuthTokenCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_TOKEN_COOKIE_NAME}=; path=/; max-age=0`;
}

export function getAdminRoleFromCookie(cookieHeader: string | undefined): RbacRole | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${ROLE_COOKIE_NAME}=([^;]+)`));
  const value = match?.[1];
  if (value === 'SUPER_ADMIN' || value === 'ADMIN') return value;
  return null;
}

export function getAdminAuthTokenFromCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${AUTH_TOKEN_COOKIE_NAME}=([^;]+)`));
  const value = match?.[1];
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
