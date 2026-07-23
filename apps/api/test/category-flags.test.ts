import { describe, expect, it } from 'vitest';

import { updateCategoryFlagsSchema } from '@community-marketplace/validation';

describe('category review flags schema', () => {
  it('accepts individual flag updates', () => {
    expect(updateCategoryFlagsSchema.parse({ requiresReview: true })).toEqual({
      requiresReview: true,
    });
    expect(updateCategoryFlagsSchema.parse({ isHidden: true })).toEqual({ isHidden: true });
    expect(updateCategoryFlagsSchema.parse({ isActive: false })).toEqual({ isActive: false });
  });

  it('rejects empty payloads', () => {
    expect(() => updateCategoryFlagsSchema.parse({})).toThrow();
  });
});
