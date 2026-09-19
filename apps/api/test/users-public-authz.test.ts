import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const usersController = readFileSync(
  path.resolve(__dirname, '../src/modules/users/users.controller.ts'),
  'utf8',
);

const usersService = readFileSync(
  path.resolve(__dirname, '../src/modules/users/users.service.ts'),
  'utf8',
);

describe('users listing authorization', () => {
  it('does not expose a public user list or user-by-id on /users', () => {
    expect(usersController).not.toMatch(/@Public\(/);
    expect(usersController).not.toMatch(/\bfindAll\b/);
    expect(usersController).not.toMatch(/\bfindOne\b/);
    expect(usersController).toMatch(/@Authenticated\(\)/);
  });

  it('does not list users under a hardcoded SUPER_ADMIN scope', () => {
    expect(usersService).not.toMatch(/listUsers\(\{ page: p, limit: l \}, 'SUPER_ADMIN'\)/);
    expect(usersService).not.toMatch(/\bfindAll\b/);
  });
});
