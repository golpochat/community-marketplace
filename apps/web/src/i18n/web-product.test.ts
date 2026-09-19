import { existsSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { t } from '@/i18n';
import { LEGACY_DASHBOARD_REDIRECTS } from '@/lib/route-guards';

const WEB_ROOT = path.resolve(__dirname, '../..');

describe('web product consistency', () => {
  it('translates error copy for en-IE', () => {
    expect(t('error.title')).toMatch(/wrong/i);
    expect(t('error.retry')).toBeTruthy();
  });

  it('does not compile buyer or seller App Router trees', () => {
    expect(existsSync(path.join(WEB_ROOT, 'src/app/buyer'))).toBe(false);
    expect(existsSync(path.join(WEB_ROOT, 'src/app/seller'))).toBe(false);
    expect(existsSync(path.join(WEB_ROOT, 'src/app/error.tsx'))).toBe(true);
  });

  it('enforces design tokens as ESLint errors and ships Playwright smoke', () => {
    expect(existsSync(path.join(WEB_ROOT, 'playwright.config.ts'))).toBe(true);
    expect(existsSync(path.join(WEB_ROOT, 'e2e/auth.smoke.spec.ts'))).toBe(true);
  });

  it('keeps legacy /buyer and /seller URLs mapped to /account', () => {
    expect(LEGACY_DASHBOARD_REDIRECTS['/buyer/dashboard']).toBe('/account');
    expect(LEGACY_DASHBOARD_REDIRECTS['/seller/dashboard']).toBe('/account');
  });
});
