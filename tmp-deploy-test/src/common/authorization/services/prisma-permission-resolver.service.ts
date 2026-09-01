import { Injectable } from '@nestjs/common';

import {
  DEFAULT_ROLE_PERMISSIONS,
  type PermissionCode,
  type RbacRole,
} from '@community-marketplace/types';

import type { AuthenticatedUser } from '../../decorators/current-user.decorator';
import { PrismaService } from '../../../database/prisma.service';
import { computeEffectivePermissions } from '../domain/effective-permissions';
import type { PermissionResolverPort } from '../ports/permission-resolver.port';

@Injectable()
export class PrismaPermissionResolverService implements PermissionResolverPort {
  constructor(private readonly prisma: PrismaService) {}

  async resolveForAuthenticatedUser(
    user: Pick<AuthenticatedUser, 'id' | 'role' | 'primaryRoleId'>,
  ) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        primaryRole: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        permissionOverrides: {
          where: {
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          include: { permission: true },
        },
      },
    });

    if (!dbUser) {
      return this.resolveFromRoleDefaults(user);
    }

    if (!dbUser?.primaryRole) {
      return this.resolveFromRoleDefaults(user);
    }

    const roleCode = dbUser.primaryRole.code as RbacRole;
    const rolePermissions =
      dbUser.primaryRole.permissions.length > 0
        ? dbUser.primaryRole.permissions.map(
            (entry) => entry.permission.code as PermissionCode,
          )
        : [...DEFAULT_ROLE_PERMISSIONS[roleCode]];

    const grantedOverrides: PermissionCode[] = [];
    const deniedOverrides: PermissionCode[] = [];

    for (const override of dbUser.permissionOverrides) {
      const code = override.permission.code as PermissionCode;
      if (override.effect === 'GRANT') {
        grantedOverrides.push(code);
      } else {
        deniedOverrides.push(code);
      }
    }

    return computeEffectivePermissions({
      userId: dbUser.id,
      primaryRole: roleCode,
      primaryRoleId: dbUser.primaryRoleId,
      rolePermissions,
      grantedOverrides,
      deniedOverrides,
    });
  }

  private resolveFromRoleDefaults(
    user: Pick<AuthenticatedUser, 'id' | 'role' | 'primaryRoleId'>,
  ) {
    const rolePermissions = [...DEFAULT_ROLE_PERMISSIONS[user.role]];

    return computeEffectivePermissions({
      userId: user.id,
      primaryRole: user.role,
      primaryRoleId: user.primaryRoleId || `default-${user.role.toLowerCase()}`,
      rolePermissions,
      grantedOverrides: [],
      deniedOverrides: [],
    });
  }
}
