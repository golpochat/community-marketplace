import { describe, expect, it } from 'vitest';

import {
  hardBlockErrorCode,
  imageFlagErrorCode,
  matchKeywordFilters,
  prohibitedErrorPayload,
  PROHIBITED_ITEMS_POLICY_PATH,
} from '@community-marketplace/utils';

describe('prohibited error codes', () => {
  it('maps hard alcohol match to PROHIBITED_ALCOHOL', () => {
    const match = matchKeywordFilters('Selling craft beer');
    expect(match.tier).toBe('hard');
    expect(hardBlockErrorCode(match)).toBe('PROHIBITED_ALCOHOL');
  });

  it('maps image hints to IMAGE_FLAG_* codes', () => {
    expect(imageFlagErrorCode(['weapon'])).toBe('IMAGE_FLAG_WEAPON');
    expect(imageFlagErrorCode(['cigarette'])).toBe('IMAGE_FLAG_INTOXICANT');
  });

  it('includes policyUrl on payloads', () => {
    const payload = prohibitedErrorPayload({
      code: 'PROHIBITED_PORK',
      message: 'Blocked',
    });
    expect(payload.policyUrl).toBe(PROHIBITED_ITEMS_POLICY_PATH);
    expect(payload.code).toBe('PROHIBITED_PORK');
  });
});
