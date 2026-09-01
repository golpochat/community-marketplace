import type { Response } from 'express';

export const REFRESH_TOKEN_COOKIE = 'cm_refresh_token';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: SEVEN_DAYS_MS,
    path: '/api/auth',
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/auth',
  });
}
