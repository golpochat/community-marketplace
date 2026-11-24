import { describe, expect, it } from 'vitest';

import {
  USER_FACING_ERRORS,
  isTechnicalErrorMessage,
  resolveUserFacingMessage,
  userFacingErrorMessage,
} from './user-facing-error';

describe('user-facing-error', () => {
  it('keeps human validation messages', () => {
    expect(resolveUserFacingMessage('Sale price must be lower than original price', 400)).toBe(
      'Sale price must be lower than original price',
    );
  });

  it('replaces local-dev and HTTP status copy', () => {
    expect(isTechnicalErrorMessage('Image upload failed (403). Is the API running on port 4000?')).toBe(
      true,
    );
    expect(
      resolveUserFacingMessage(
        'Cannot reach the API at http://localhost:4000/api. Start it with: pnpm --filter api dev',
        0,
        USER_FACING_ERRORS.network,
      ),
    ).toBe(USER_FACING_ERRORS.network);
    expect(resolveUserFacingMessage('Request failed with status 500', 500)).toBe(
      USER_FACING_ERRORS.server,
    );
  });

  it('maps thrown errors through the same rules', () => {
    expect(
      userFacingErrorMessage(
        new Error('No categories are configured. Run `pnpm seed` from the repo root, then refresh this page.'),
        USER_FACING_ERRORS.categoriesUnavailable,
      ),
    ).toBe(USER_FACING_ERRORS.categoriesUnavailable);
  });
});
