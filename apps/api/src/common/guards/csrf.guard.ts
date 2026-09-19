import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';

import { SKIP_CSRF_KEY } from '../decorators/skip-csrf.decorator';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  createCsrfToken,
  csrfTokensMatch,
  readCsrfCookieToken,
} from '../csrf/csrf.util';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const method = (request.method ?? 'GET').toUpperCase();

    if (SAFE_METHODS.has(method)) {
      this.ensureCookie(request, response);
      return true;
    }

    const cookieToken = readCsrfCookieToken(request.cookies?.[CSRF_COOKIE_NAME]);
    const header = request.headers[CSRF_HEADER_NAME];
    const headerToken = typeof header === 'string' ? header : Array.isArray(header) ? header[0] : '';

    if (!cookieToken || !headerToken || !csrfTokensMatch(cookieToken, headerToken)) {
      throw new ForbiddenException('CSRF token missing or invalid');
    }

    return true;
  }

  private ensureCookie(request: Request, response: Response) {
    if (readCsrfCookieToken(request.cookies?.[CSRF_COOKIE_NAME])) return;
    const { cookieValue } = createCsrfToken();
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookie(CSRF_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
