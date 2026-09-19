import { createHmac, timingSafeEqual } from 'node:crypto';
import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { CsrfGuard } from '../src/common/guards/csrf.guard';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  createCsrfToken,
  csrfTokensMatch,
  readCsrfCookieToken,
} from '../src/common/csrf/csrf.util';

function context(method: string, cookie?: string, header?: string) {
  const cookies: Record<string, string> = {};
  if (cookie) cookies[CSRF_COOKIE_NAME] = cookie;
  const headers: Record<string, string> = {};
  if (header) headers[CSRF_HEADER_NAME] = header;
  const resCookies: unknown[] = [];
  return {
    switchToHttp: () => ({
      getRequest: () => ({ method, cookies, headers }),
      getResponse: () => ({
        cookie: (...args: unknown[]) => resCookies.push(args),
      }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
    _resCookies: resCookies,
  };
}

describe('CSRF double-submit', () => {
  const guard = new CsrfGuard({
    getAllAndOverride: () => false,
  } as never);

  it('signs tokens so a forged cookie is rejected', () => {
    const { token, cookieValue } = createCsrfToken();
    expect(readCsrfCookieToken(cookieValue)).toBe(token);
    expect(readCsrfCookieToken(`${token}.deadbeef`)).toBeNull();
    expect(csrfTokensMatch(token, token)).toBe(true);
    const other = createHmac('sha256', 'nope').update(token).digest('hex');
    expect(timingSafeEqual(Buffer.from(token), Buffer.from(token))).toBe(true);
    expect(other).not.toBe(cookieValue.split('.')[1]);
  });

  it('allows GET and issues a cookie when missing', () => {
    const ctx = context('GET');
    expect(guard.canActivate(ctx as never)).toBe(true);
    expect(ctx._resCookies.length).toBe(1);
  });

  it('rejects POST without a matching header', () => {
    const { cookieValue } = createCsrfToken();
    expect(() => guard.canActivate(context('POST', cookieValue) as never)).toThrow(
      ForbiddenException,
    );
  });

  it('allows POST when cookie and header match', () => {
    const { token, cookieValue } = createCsrfToken();
    expect(guard.canActivate(context('POST', cookieValue, token) as never)).toBe(true);
  });
});
