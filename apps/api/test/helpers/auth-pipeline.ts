import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { AuthorizationService } from '../../src/common/authorization/authorization.service';
import { PrismaPermissionResolverService } from '../../src/common/authorization/services/prisma-permission-resolver.service';
import { AuthGuard } from '../../src/common/guards/auth.guard';
import { RolesPermissionsGuard } from '../../src/common/guards/roles-permissions.guard';
import { PrismaService } from '../../src/database/prisma.service';
import { AuthService } from '../../src/modules/auth/auth.service';
import { AuthAuditService } from '../../src/modules/auth/services/auth-audit.service';
import { AuthSecurityService } from '../../src/modules/auth/services/auth-security.service';
import { JwtAuthService } from '../../src/modules/auth/services/jwt-auth.service';
import { SessionService } from '../../src/modules/auth/services/session.service';

import { getTestPrisma } from './db';

export interface PipelineRequest {
  headers: { authorization?: string };
  user?: unknown;
}

export function handlerContext(controller: object, handler: (...args: never[]) => unknown, request: PipelineRequest) {
  return {
    getHandler: () => handler,
    getClass: () => controller.constructor,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as never;
}

export function createAuthPipeline() {
  const prisma = getTestPrisma() as unknown as PrismaService;
  const jwtAuth = new JwtAuthService(
    new JwtService({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-in-production',
    }),
  );
  const audit = new AuthAuditService(prisma);
  const sessions = new SessionService(prisma);
  const auth = new AuthService(
    {} as never,
    jwtAuth,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    sessions,
    new AuthSecurityService(prisma, audit),
    audit,
    { publish: () => undefined, subscribe: () => undefined } as never,
    prisma,
  );
  const reflector = new Reflector();
  const authGuard = new AuthGuard(reflector, jwtAuth);
  const rbacGuard = new RolesPermissionsGuard(
    reflector,
    new AuthorizationService(new PrismaPermissionResolverService(prisma)),
  );

  return { prisma, jwtAuth, auth, authGuard, rbacGuard };
}
