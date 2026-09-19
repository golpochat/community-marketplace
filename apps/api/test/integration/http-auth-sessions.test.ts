import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BOOTSTRAP_USERS } from '../../src/database/bootstrap-users.seed.data';
import { AdminUsersController } from '../../src/modules/users/admin-users.controller';
import { UsersController } from '../../src/modules/users/users.controller';
import {
  createAuthPipeline,
  handlerContext,
  type PipelineRequest,
} from '../helpers/auth-pipeline';
import { disconnectTestPrisma, hasDatabase, seedBootstrapDatabase } from '../helpers/db';

const describeIfDb = hasDatabase ? describe : describe.skip;
const SESSION_CONTEXT = { ipAddress: '127.0.0.1', userAgent: 'vitest' };

describeIfDb('auth sessions and role authz pipeline', () => {
  const pipeline = createAuthPipeline();
  const users = new UsersController({} as never, {} as never);
  const adminUsers = new AdminUsersController({} as never);

  beforeAll(async () => {
    await seedBootstrapDatabase();
  }, 120_000);

  afterAll(async () => {
    await disconnectTestPrisma();
  });

  async function loginAs(role: (typeof BOOTSTRAP_USERS)[number]['role']) {
    const seed = BOOTSTRAP_USERS.find((user) => user.role === role);
    if (!seed) throw new Error(`Missing bootstrap user for ${role}`);
    return pipeline.auth.login({ email: seed.email, password: seed.password }, SESSION_CONTEXT);
  }

  async function authorize(controller: object, handler: (...args: never[]) => unknown, token?: string) {
    const request: PipelineRequest = {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    };
    const context = handlerContext(controller, handler, request);
    pipeline.authGuard.canActivate(context);
    await pipeline.rbacGuard.canActivate(context);
    return request;
  }

  it('rejects invalid password', async () => {
    await expect(
      pipeline.auth.login({ email: 'member@sellnearby.ie', password: 'WrongPassword1!' }, SESSION_CONTEXT),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logs in MEMBER to /account and operators to their dashboards', async () => {
    const member = await loginAs('MEMBER');
    expect(member.user.role).toBe('MEMBER');
    expect(member.redirectPath).toBe('/account');
    expect(member.accessToken).toBeTruthy();

    const admin = await loginAs('ADMIN');
    expect(admin.redirectPath).toBe('/admin/dashboard');

    const superAdmin = await loginAs('SUPER_ADMIN');
    expect(superAdmin.redirectPath).toBe('/super-admin/dashboard');
  });

  it('rotates refresh tokens and rejects the previous refresh token', async () => {
    const session = await loginAs('MEMBER');
    const rotated = await pipeline.auth.refreshToken(
      { refreshToken: session.refreshToken },
      SESSION_CONTEXT,
    );
    expect(rotated.accessToken).toBeTruthy();
    expect(rotated.refreshToken).not.toBe(session.refreshToken);

    await expect(
      pipeline.auth.refreshToken({ refreshToken: session.refreshToken }, SESSION_CONTEXT),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('requires a bearer token for /users/me and allows a member session', async () => {
    await expect(authorize(users, users.getMe)).rejects.toBeInstanceOf(UnauthorizedException);

    const session = await loginAs('MEMBER');
    const request = await authorize(users, users.getMe, session.accessToken);
    expect(request.user).toMatchObject({ email: 'member@sellnearby.ie', role: 'MEMBER' });
  });

  it('forbids members from GET /admin/users and allows ADMIN', async () => {
    await expect(authorize(adminUsers, adminUsers.listUsers)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    const member = await loginAs('MEMBER');
    await expect(authorize(adminUsers, adminUsers.listUsers, member.accessToken)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    const admin = await loginAs('ADMIN');
    await expect(authorize(adminUsers, adminUsers.listUsers, admin.accessToken)).resolves.toBeTruthy();
  });

  it('allows ACCOUNTS_ADMIN to list users and denies FINANCIAL_ADMIN', async () => {
    const accounts = await loginAs('ACCOUNTS_ADMIN');
    await expect(
      authorize(adminUsers, adminUsers.listUsers, accounts.accessToken),
    ).resolves.toBeTruthy();

    const financial = await loginAs('FINANCIAL_ADMIN');
    await expect(
      authorize(adminUsers, adminUsers.listUsers, financial.accessToken),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
