import { describe, expect, it } from 'vitest';

import { analyticsConsentGranted } from './cookie-consent';

describe('cookie consent', () => {
  it('only treats analytics as granted when the user opted in', () => {
    expect(analyticsConsentGranted(null)).toBe(false);
    expect(analyticsConsentGranted('necessary')).toBe(false);
    expect(analyticsConsentGranted('analytics')).toBe(true);
  });
});
