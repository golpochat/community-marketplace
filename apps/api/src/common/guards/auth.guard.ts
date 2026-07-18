import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { RbacRole } from '@community-marketplace/types';

import { JwtAuthService } from '../../modules/auth/services/jwt-auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      cookies?: Record<string, string>;
      user?: AuthenticatedUser;
    }>();

    const authHeader = request.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;

    if (!bearerToken) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }

    try {
      const payload = this.jwtAuthService.verifyAccessToken(bearerToken);
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role as RbacRole,
        primaryRoleId: payload.primaryRoleId,
        sessionId: payload.sid,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired authorization token');
    }
  }
}
