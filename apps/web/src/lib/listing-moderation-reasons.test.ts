import { describe, expect, it } from 'vitest';

import {
  LISTING_MODERATION_REASON_OTHER,
  composeModerationReason,
} from './listing-moderation-reasons';

describe('composeModerationReason', () => {
  it('returns preset alone when detail is empty', () => {
    expect(composeModerationReason('Duplicate listing', '  ')).toBe('Duplicate listing');
  });

  it('joins preset and detail', () => {
    expect(composeModerationReason('Duplicate listing', 'Same bike twice')).toBe(
      'Duplicate listing — Same bike twice',
    );
  });

  it('returns only detail for Other', () => {
    expect(composeModerationReason(LISTING_MODERATION_REASON_OTHER, 'Custom cause')).toBe(
      'Custom cause',
    );
  });
});
