import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from '@community-marketplace/types';

import type { AuthenticatedUser } from '../src/common/decorators/current-user.decorator';
import {
  Authenticated,
  RequirePermissions,
  RequireRole,
} from '../src/common/decorators/rbac.decorator';
import { Public } from '../src/common/decorators/public.decorator';
import { RolesPermissionsGuard } from '../src/common/guards/roles-permissions.guard';

class PublicHandler {
  @Public()
  run() {
    return true;
  }
}

class BareHandler {
  run() {
    return true;
  }
}

class SelfServiceHandler {
  @Authenticated()
  run() {
    return true;
  }
}

class AdminHandler {
  @RequireRole('ADMIN', 'SUPER_ADMIN')
  @RequirePermissions(PERMISSIONS.VIEW_USERS)
  run() {
    return true;
  }
}

function contextFor(
  instance: object,
  methodName: string,
  user?: AuthenticatedUser,
) {
  const handler = (instance as Record<string, () => unknown>)[methodName];
  return {
    getHandler: () => handler,
    getClass: () => instance.constructor,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as never;
}

const buyer: AuthenticatedUser = {
  id: 'user-1',
  email: 'buyer@example.com',
  role: 'BUYER',
  primaryRoleId: 'role-buyer',
};

const admin: AuthenticatedUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'ADMIN',
  primaryRoleId: 'role-admin',
};

function createGuard() {
  const authorization = {
    resolveForUser: vi.fn().mockResolvedValue({
      userId: admin.id,
      primaryRole: admin.role,
      primaryRoleId: admin.primaryRoleId,
      rolePermissions: [PERMISSIONS.VIEW_USERS],
      grantedOverrides: [],
      deniedOverrides: [],
      effective: [PERMISSIONS.VIEW_USERS],
    }),
  };

  return {
    guard: new RolesPermissionsGuard(new Reflector(), authorization as never),
    authorization,
  };
}

describe('RolesPermissionsGuard fail-closed policy', () => {
  it('allows @Public handlers without a user', async () => {
    const { guard } = createGuard();
    await expect(guard.canActivate(contextFor(new PublicHandler(), 'run'))).resolves.toBe(true);
  });

  it('denies authenticated handlers that declare no authorization metadata', async () => {
    const { guard } = createGuard();
    await expect(guard.canActivate(contextFor(new BareHandler(), 'run', buyer))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows @Authenticated self-service handlers', async () => {
    const { guard } = createGuard();
    await expect(
      guard.canActivate(contextFor(new SelfServiceHandler(), 'run', buyer)),
    ).resolves.toBe(true);
  });

  it('rejects @Authenticated handlers without a user', async () => {
    const { guard } = createGuard();
    await expect(guard.canActivate(contextFor(new SelfServiceHandler(), 'run'))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects role mismatch even when the user is authenticated', async () => {
    const { guard } = createGuard();
    await expect(guard.canActivate(contextFor(new AdminHandler(), 'run', buyer))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows matching role and permission', async () => {
    const { guard } = createGuard();
    await expect(guard.canActivate(contextFor(new AdminHandler(), 'run', admin))).resolves.toBe(true);
  });
});
