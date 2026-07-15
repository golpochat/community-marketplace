import type { PrismaClient } from '../../../generated/prisma';

import type { RbacRole } from '@community-marketplace/types';

import { DEV_PERSONA_ROLE_IDS, DEV_ROLE_IDS } from '../../common/constants/dev-role-ids';
import {
  PERMISSION_SEED,
  ROLE_PERMISSION_SEED,
  PERSONA_ROLE_PERMISSION_SEED,
  ROLE_SEED,
} from '../rbac-seed.data';
import { BOOTSTRAP_USERS } from '../bootstrap-users.seed.data';
import { hashPassword } from './password-hash';
import { assertRbacSeedAllowed } from './seed-environment';
import { loadRbacSeedConfig, type RbacSeedConfig } from './seed-config';

export interface RbacSeedResult {
  rolesUpserted: number;
  permissionsUpserted: number;
  rolePermissionsUpserted: number;
  bootstrapUsers: Array<{
    id: string;
    email: string;
    role: string;
    created: boolean;
    passwordUpdated: boolean;
  }>;
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
  const bootstrapUsers = await seedBootstrapUsers(prisma, config);

  const rolePermissionCounts = await summarizeRolePermissions(prisma);

  const result: RbacSeedResult = {
    rolesUpserted,
    permissionsUpserted,
    rolePermissionsUpserted,
    bootstrapUsers,
  };

  console.log('[rbac-seed] Complete:', {
    rolesUpserted,
    permissionsUpserted,
    rolePermissionsUpserted,
    rolePermissionCounts,
    bootstrapUsers: bootstrapUsers.map((user) => ({
      email: user.email,
      role: user.role,
      created: user.created,
    })),
  });

  if (config.NODE_ENV !== 'production') {
    console.warn(
      `[rbac-seed] Bootstrap accounts seeded — change default passwords after first login.`,
    );
  }

  return result;
}

async function seedRoles(prisma: PrismaClient): Promise<number> {
  let count = 0;

  for (const role of ROLE_SEED) {
    const code = role.code;
    const stableId = DEV_ROLE_IDS[code as RbacRole] ?? DEV_PERSONA_ROLE_IDS[code as keyof typeof DEV_PERSONA_ROLE_IDS];
    if (!stableId) {
      throw new Error(`Missing stable role ID for seed role: ${code}`);
    }

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

  for (const [roleCode, permissionCodes] of Object.entries({
    ...ROLE_PERMISSION_SEED,
    ...PERSONA_ROLE_PERMISSION_SEED,
  })) {
    const role = roleByCode.get(roleCode);
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

async function seedBootstrapUsers(
  prisma: PrismaClient,
  config: RbacSeedConfig,
): Promise<RbacSeedResult['bootstrapUsers']> {
  const roles = await prisma.role.findMany();
  const roleByCode = new Map(roles.map((role) => [role.code, role]));
  const users: RbacSeedResult['bootstrapUsers'] = [];

  for (const entry of BOOTSTRAP_USERS) {
    const role = roleByCode.get(entry.role);
    if (!role) {
      throw new Error(`Role ${entry.role} not found — run role seed first`);
    }

    const email =
      entry.role === 'SUPER_ADMIN' ? config.RBAC_SUPER_ADMIN_EMAIL : entry.email;
    const password =
      entry.role === 'SUPER_ADMIN' ? config.RBAC_SUPER_ADMIN_PASSWORD : entry.password;
    const displayName =
      entry.role === 'SUPER_ADMIN'
        ? config.RBAC_SUPER_ADMIN_DISPLAY_NAME
        : entry.displayName;

    const existing =
      (await prisma.user.findUnique({ where: { email } })) ??
      (await prisma.user.findUnique({ where: { id: entry.id } }));
    const passwordHash = hashPassword(password);
    const shouldUpdatePassword = config.RBAC_SEED_RESET_PASSWORD || !existing;

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          email,
          primaryRoleId: role.id,
          displayName,
          status: 'active',
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
          phoneVerifiedAt: entry.phone ? (existing.phoneVerifiedAt ?? new Date()) : existing.phoneVerifiedAt,
          profileCompleted: true,
          ...(shouldUpdatePassword ? { passwordHash } : {}),
        },
      });
    } else {
      await prisma.user.create({
        data: {
          id: entry.id,
          email,
          passwordHash,
          displayName,
          primaryRoleId: role.id,
          status: 'active',
          emailVerifiedAt: new Date(),
          phoneVerifiedAt: entry.phone ? new Date() : undefined,
          profileCompleted: true,
        },
      });
    }

    if (entry.phone) {
      const userId = existing?.id ?? entry.id;
      await prisma.userProfile.deleteMany({
        where: { phone: entry.phone, userId: { not: userId } },
      });
      await prisma.userProfile.upsert({
        where: { userId },
        create: { userId, phone: entry.phone },
        update: { phone: entry.phone },
      });
    }

    users.push({
      id: existing?.id ?? entry.id,
      email,
      role: entry.role,
      created: !existing,
      passwordUpdated: shouldUpdatePassword,
    });
  }

  return users;
}

async function summarizeRolePermissions(prisma: PrismaClient): Promise<Record<string, number>> {
  const roles = await prisma.role.findMany({
    include: { _count: { select: { permissions: true } } },
    orderBy: { code: 'asc' },
  });

  return Object.fromEntries(roles.map((role) => [role.code, role._count.permissions]));
}
