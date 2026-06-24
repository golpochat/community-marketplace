import type { PrismaClient } from '@prisma/client';
import { RbacRoleCode } from '@prisma/client';

import { DEV_BOOTSTRAP_USERS } from '../dev-users.seed.data';
import { hashPassword } from './password-hash';
import { assertRbacSeedAllowed } from './seed-environment';
import { loadRbacSeedConfig } from './seed-config';

export interface DevUsersSeedResult {
  usersUpserted: number;
  users: Array<{ id: string; email: string; role: string; created: boolean }>;
}

export async function runDevUsersSeed(prisma: PrismaClient): Promise<DevUsersSeedResult> {
  const config = loadRbacSeedConfig();
  assertRbacSeedAllowed(config);

  console.log('[dev-users-seed] Starting (NODE_ENV=%s)', config.NODE_ENV);

  const roles = await prisma.role.findMany();
  const roleByCode = new Map(roles.map((role) => [role.code, role]));

  const users: DevUsersSeedResult['users'] = [];
  let usersUpserted = 0;

  for (const entry of DEV_BOOTSTRAP_USERS) {
    const role = roleByCode.get(entry.role as RbacRoleCode);
    if (!role) {
      throw new Error(`Role ${entry.role} not found — run RBAC seed first`);
    }

    const existing = await prisma.user.findUnique({ where: { email: entry.email } });
    const passwordHash = hashPassword(entry.password);
    const shouldUpdatePassword = config.RBAC_SEED_RESET_PASSWORD || !existing;

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          primaryRoleId: role.id,
          displayName: entry.displayName,
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
          email: entry.email,
          passwordHash,
          displayName: entry.displayName,
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
      await prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          phone: entry.phone,
        },
        update: {
          phone: entry.phone,
        },
      });
    }

    users.push({
      id: existing?.id ?? entry.id,
      email: entry.email,
      role: entry.role,
      created: !existing,
    });
    usersUpserted += 1;
  }

  console.log('[dev-users-seed] Complete:', { usersUpserted, users });
  return { usersUpserted, users };
}
