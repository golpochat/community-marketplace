import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const CSRF_COOKIE_NAME = 'cm_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

function csrfSecret(): string {
  return process.env.CSRF_SECRET || process.env.JWT_SECRET || 'dev-csrf-secret-change-me';
}

function sign(token: string): string {
  return createHmac('sha256', csrfSecret()).update(token).digest('hex');
}

export function createCsrfToken(): { token: string; cookieValue: string } {
  const token = randomBytes(32).toString('hex');
  return { token, cookieValue: `${token}.${sign(token)}` };
}

export function readCsrfCookieToken(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null;
  const sep = cookieValue.lastIndexOf('.');
  if (sep <= 0) return null;
  const token = cookieValue.slice(0, sep);
  const digest = cookieValue.slice(sep + 1);
  const expected = sign(token);
  const left = Buffer.from(digest);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }
  return token;
}

export function csrfTokensMatch(cookieToken: string, headerToken: string): boolean {
  const left = Buffer.from(cookieToken);
  const right = Buffer.from(headerToken);
  return left.length === right.length && timingSafeEqual(left, right);
}
