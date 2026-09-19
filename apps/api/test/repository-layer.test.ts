import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../../..');
const API_SRC = path.join(ROOT, 'apps/api/src');

function readSrc(relative: string) {
  return readFileSync(path.join(API_SRC, relative), 'utf8');
}

describe('repository layer', () => {
  it('exposes UserRepository and StripeEventRepository from DatabaseModule', () => {
    expect(existsSync(path.join(API_SRC, 'database/repositories/user.repository.ts'))).toBe(true);
    expect(existsSync(path.join(API_SRC, 'database/repositories/stripe-event.repository.ts'))).toBe(
      true,
    );

    const databaseModule = readSrc('database/database.module.ts');
    expect(databaseModule).toMatch(/UserRepository/);
    expect(databaseModule).toMatch(/StripeEventRepository/);
  });

  it('keeps UsersService off Prisma for user lookups', () => {
    const usersService = readSrc('modules/users/users.service.ts');
    expect(usersService).toMatch(/UserRepository/);
    expect(usersService).not.toMatch(/this\.prisma\.user/);
  });

  it('claims Stripe webhook events through StripeEventRepository', () => {
    const webhooks = readSrc('modules/payments/services/payments-webhooks.service.ts');
    expect(webhooks).toMatch(/StripeEventRepository/);
    expect(webhooks).not.toMatch(/this\.prisma\.processedStripeEvent/);
  });
});
