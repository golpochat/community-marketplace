import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const controller = readFileSync(
  path.resolve(__dirname, '../src/modules/dev-upload/dev-upload.controller.ts'),
  'utf8',
);

describe('dev-upload CSRF', () => {
  it('skips CSRF so browser photo PUTs are not rejected with 403', () => {
    expect(controller).toMatch(/@SkipCsrf\(\)/);
    expect(controller).toMatch(/@Public\(\)/);
    expect(controller).toMatch(/@Controller\('dev-upload'\)/);
  });
});
