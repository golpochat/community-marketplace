import type { PrismaClient } from '../../../generated/prisma';

import type { RbacRole } from '@community-marketplace/types';

import { DEV_ROLE_IDS } from '../../common/constants/dev-role-ids';
import {
  PERMISSION_SEED,
  ROLE_PERMISSION_SEED,
  ROLE_SEED,
  SUPER_ADMIN_BOOTSTRAP_USER_ID,
} from '../rbac-seed.data';
import { hashPassword } from './password-hash';
import { assertRbacSeedAllowed } from './seed-environment';
import { loadRbacSeedConfig, type RbacSeedConfig } from './seed-config';

export interface RbacSeedResult {
  rolesUpserted: number;
  permissionsUpserted: number;
  rolePermissionsUpserted: number;
  superAdmin: {
    id: string;
    email: string;
    created: boolean;
    passwordUpdated: boolean;
  };
}

export interface RunRbacSeedOptions {
  /** Skip environment guard (unit tests only). */
  skipEnvironmentCheck?: boolean;
  config?: RbacSeedConfig;
}

export async function runRbacSeed(
  prisma: PrismaClient,
  options: RunRbacSeedOptions = {},
): Promise<RbacSeedResult> {
  const config = options.config ?? loadRbacSeedConfig();

  if (!options.skipEnvironmentCheck) {
    assertRbacSeedAllowed(config);
  }

  console.log(`[rbac-seed] Starting (NODE_ENV=${config.NODE_ENV})`);

  const rolesUpserted = await seedRoles(prisma);
  const permissionsUpserted = await seedPermissions(prisma);
  const rolePermissionsUpserted = await seedRolePermissions(prisma);
  const superAdmin = await seedSuperAdminUser(prisma, config);

  const rolePermissionCounts = await summarizeRolePermissions(prisma);

  const result: RbacSeedResult = {
    rolesUpserted,
    permissionsUpserted,
    rolePermissionsUpserted,
    superAdmin,
  };

  console.log('[rbac-seed] Complete:', {
    rolesUpserted,
    permissionsUpserted,
    rolePermissionsUpserted,
    rolePermissionCounts,
    superAdminEmail: superAdmin.email,
    superAdminCreated: superAdmin.created,
  });

  if (config.NODE_ENV !== 'production') {
    console.warn(
      `[rbac-seed] Bootstrap SUPER_ADMIN: ${superAdmin.email} — change RBAC_SUPER_ADMIN_PASSWORD after first login.`,
    );
  }

  return result;
}

async function seedRoles(prisma: PrismaClient): Promise<number> {
  let count = 0;

  for (const role of ROLE_SEED) {
    const code = role.code;
    const stableId = DEV_ROLE_IDS[code];

    await prisma.role.upsert({
      where: { code },
      create: {
        id: stableId,
        code,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
      update: {
        name: role.name,
        description: role.description,
      },
    });
    count += 1;
  }

  return count;
}

async function seedPermissions(prisma: PrismaClient): Promise<number> {
  let count = 0;

  for (const permission of PERMISSION_SEED) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      create: {
        code: permission.code,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        isSystem: true,
      },
      update: {
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
      },
    });
    count += 1;
  }

  return count;
}

async function seedRolePermissions(prisma: PrismaClient): Promise<number> {
  const roles = await prisma.role.findMany();
  const permissions = await prisma.permission.findMany();
  const permissionByCode = new Map(permissions.map((entry) => [entry.code, entry]));
  const roleByCode = new Map(roles.map((entry) => [entry.code, entry]));

  let count = 0;

  for (const [roleCode, permissionCodes] of Object.entries(ROLE_PERMISSION_SEED)) {
    const role = roleByCode.get(roleCode as RbacRole);
    if (!role) continue;

    for (const code of permissionCodes) {
      const permission = permissionByCode.get(code);
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
        update: {},
      });
      count += 1;
    }
  }

  return count;
}

async function seedSuperAdminUser(
  prisma: PrismaClient,
  config: RbacSeedConfig,
): Promise<RbacSeedResult['superAdmin']> {
  const superAdminRole = await prisma.role.findUnique({
    where: { code: 'SUPER_ADMIN' },
  });

  if (!superAdminRole) {
    throw new Error('SUPER_ADMIN role not found — run role seed first');
  }

  const existing = await prisma.user.findUnique({
    where: { email: config.RBAC_SUPER_ADMIN_EMAIL },
  });

  const passwordHash = hashPassword(config.RBAC_SUPER_ADMIN_PASSWORD);
  const shouldUpdatePassword = config.RBAC_SEED_RESET_PASSWORD || !existing;

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        primaryRoleId: superAdminRole.id,
        displayName: config.RBAC_SUPER_ADMIN_DISPLAY_NAME,
        status: 'active',
        emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
        ...(shouldUpdatePassword ? { passwordHash } : {}),
      },
    });

    return {
      id: existing.id,
      email: existing.email,
      created: false,
      passwordUpdated: shouldUpdatePassword,
    };
  }

    const created = await prisma.user.create({
      data: {
        id: SUPER_ADMIN_BOOTSTRAP_USER_ID,
        email: config.RBAC_SUPER_ADMIN_EMAIL,
        passwordHash,
        displayName: config.RBAC_SUPER_ADMIN_DISPLAY_NAME,
        primaryRoleId: superAdminRole.id,
        status: 'active',
        emailVerifiedAt: new Date(),
      },
    });

  return {
    id: created.id,
    email: created.email,
    created: true,
    passwordUpdated: true,
  };
}

async function summarizeRolePermissions(prisma: PrismaClient): Promise<Record<string, number>> {
  const roles = await prisma.role.findMany({
    include: { _count: { select: { permissions: true } } },
    orderBy: { code: 'asc' },
  });

  return Object.fromEntries(roles.map((role) => [role.code, role._count.permissions]));
}
