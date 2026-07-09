import type { RoleCodeValue } from '@community-marketplace/types';
import { isAdminPersonaRoleCode } from '@community-marketplace/types';

export const AUTH_TOKEN_COOKIE_NAME = 'cm-web-token';
export const REFRESH_TOKEN_COOKIE_NAME = 'cm-web-refresh-token';

interface WebAuthJwtPayload {
  sub?: string;
  role?: string;
  exp?: number;
}

export function parseWebAuthJwtPayload(token: string): WebAuthJwtPayload | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json) as WebAuthJwtPayload;
  } catch {
    return null;
  }
}

export function isWebAuthTokenExpired(token: string, skewSeconds = 0): boolean {
  const payload = parseWebAuthJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
}

function isKnownWebRole(role: string | undefined): role is RoleCodeValue {
  if (!role) return false;
  return (
    role === 'SELLER' ||
    role === 'BUYER' ||
    role === 'SUPER_ADMIN' ||
    role === 'ADMIN' ||
    isAdminPersonaRoleCode(role)
  );
}

export function getWebAuthTokenFromCookie(cookieHeader: string | undefined): string | null {
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

export function getWebRefreshTokenFromCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${REFRESH_TOKEN_COOKIE_NAME}=([^;]+)`));
  const value = match?.[1];
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Role bound to the active access-token session (trusted for routing). */
export function getWebRoleFromAuthTokenCookie(cookieHeader: string | undefined): RoleCodeValue | null {
  const token = getWebAuthTokenFromCookie(cookieHeader);
  if (!token || isWebAuthTokenExpired(token)) return null;

  const role = parseWebAuthJwtPayload(token)?.role;
  return isKnownWebRole(role) ? role : null;
}

export function setWebAuthTokenCookie(token: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
}

export function setWebRefreshTokenCookie(token: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${REFRESH_TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
}

export function clearWebAuthTokenCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_TOKEN_COOKIE_NAME}=; path=/; max-age=0`;
}

export function clearWebRefreshTokenCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${REFRESH_TOKEN_COOKIE_NAME}=; path=/; max-age=0`;
}
