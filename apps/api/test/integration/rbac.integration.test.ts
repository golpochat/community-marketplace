import { describe, expect, it, beforeAll, afterAll } from 'vitest';

import { PERMISSION_CODES } from '@community-marketplace/types';

import { BOOTSTRAP_USERS } from '../../src/database/bootstrap-users.seed.data';

import {
  disconnectTestPrisma,
  getTestPrisma,
  hasDatabase,
  seedBootstrapDatabase,
} from '../helpers/db';

const describeIfDb = hasDatabase ? describe : describe.skip;

describeIfDb('RBAC seed integration', () => {
  beforeAll(async () => {
    await seedBootstrapDatabase();
  }, 120_000);

  afterAll(async () => {
    await disconnectTestPrisma();
  });

  it('creates all system roles including admin personas', async () => {
    const prisma = getTestPrisma();
    const roles = await prisma.role.findMany({ orderBy: { code: 'asc' } });
    const codes = roles.map((role) => role.code);

    expect(codes).toContain('SUPER_ADMIN');
    expect(codes).toContain('ADMIN');
    expect(codes).toContain('ACCOUNTS_ADMIN');
    expect(codes).toContain('MODERATION_ADMIN');
    expect(codes).toContain('FINANCIAL_ADMIN');
    expect(codes).toContain('SELLER');
    expect(codes).toContain('BUYER');
    expect(codes).toContain('MEMBER');
  });

  it('assigns buyer-default permissions to MEMBER', async () => {
    const prisma = getTestPrisma();
    const role = await prisma.role.findFirstOrThrow({ where: { code: 'MEMBER' } });
    const permissions = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      include: { permission: true },
    });
    const codes = permissions.map((row) => row.permission.code);

    expect(codes).toContain('purchase_item');
    expect(codes).toContain('view_listings');
    expect(codes).not.toContain('create_listing');
  });

  it('seeds expected permission catalog size', async () => {
    const prisma = getTestPrisma();
    const count = await prisma.permission.count();
    expect(count).toBeGreaterThanOrEqual(PERMISSION_CODES.length);
  });

  it('scopes ACCOUNTS_ADMIN away from fraud and payments permissions', async () => {
    const prisma = getTestPrisma();
    const role = await prisma.role.findFirstOrThrow({ where: { code: 'ACCOUNTS_ADMIN' } });
    const permissions = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      include: { permission: true },
    });
    const codes = permissions.map((row) => row.permission.code);

    expect(codes).toContain('view_users');
    expect(codes).not.toContain('view_fraud');
    expect(codes).not.toContain('view_payments');
  });

  it('scopes FINANCIAL_ADMIN to payments but not moderation reports', async () => {
    const prisma = getTestPrisma();
    const role = await prisma.role.findFirstOrThrow({ where: { code: 'FINANCIAL_ADMIN' } });
    const permissions = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      include: { permission: true },
    });
    const codes = permissions.map((row) => row.permission.code);

    expect(codes).toContain('view_payments');
    expect(codes).not.toContain('view_reports');
  });

  it('creates bootstrap accounts for each operator tier', async () => {
    const prisma = getTestPrisma();

    for (const entry of BOOTSTRAP_USERS) {
      const email =
        entry.role === 'SUPER_ADMIN'
          ? (process.env.RBAC_SUPER_ADMIN_EMAIL ?? entry.email)
          : entry.email;
      const user = await prisma.user.findUnique({
        where: { email },
        include: { primaryRole: true },
      });

      expect(user, `missing ${email}`).not.toBeNull();
      expect(user?.primaryRole.code).toBe(entry.role);
    }
  });

  it('seeds level-3 MEMBER marketplace account', async () => {
    const prisma = getTestPrisma();
    const member = await prisma.user.findUniqueOrThrow({
      where: { email: 'member@sellnearby.ie' },
      include: { primaryRole: true, profile: true },
    });

    expect(member.primaryRole.code).toBe('MEMBER');
    expect(member.profile?.phone).toBe('+353871000099');
  });
});
