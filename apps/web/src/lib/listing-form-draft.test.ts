import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  GENERIC_LISTING_DRAFT_KEY,
  clearGenericListingDraft,
  loadGenericListingDraft,
  sanitizeAiPreviews,
  saveGenericListingDraft,
} from './listing-form-draft';

function installSessionStorageMock() {
  const store = new Map<string, string>();
  const mock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
  vi.stubGlobal('sessionStorage', mock);
  vi.stubGlobal('window', { sessionStorage: mock });
}

describe('listing-form-draft AI previews', () => {
  beforeEach(() => {
    installSessionStorageMock();
  });

  afterEach(() => {
    clearGenericListingDraft();
    vi.unstubAllGlobals();
  });

  it('sanitizes preview maps', () => {
    expect(
      sanitizeAiPreviews({
        seo_title: 'Bike for sale',
        description: '  ',
        keywords: 12,
      }),
    ).toEqual({ seo_title: 'Bike for sale' });
  });

  it('persists and restores AI previews across save/load', () => {
    saveGenericListingDraft({
      step: 0,
      highestCompletedStep: -1,
      data: { title: 'Old title' },
      aiPreviews: {
        seo_title: 'Great Dublin bike',
        description: 'Lightly used…',
      },
    });

    const draft = loadGenericListingDraft<{ title: string }>();
    expect(draft?.version).toBe(2);
    expect(draft?.aiPreviews).toEqual({
      seo_title: 'Great Dublin bike',
      description: 'Lightly used…',
    });
    expect(draft?.data.title).toBe('Old title');
  });

  it('still loads v1 drafts without aiPreviews', () => {
    sessionStorage.setItem(
      GENERIC_LISTING_DRAFT_KEY,
      JSON.stringify({
        version: 1,
        step: 1,
        highestCompletedStep: 0,
        data: { title: 'Legacy' },
        savedAt: new Date().toISOString(),
      }),
    );
    const draft = loadGenericListingDraft<{ title: string }>();
    expect(draft?.data.title).toBe('Legacy');
    expect(draft?.aiPreviews).toBeUndefined();
  });
});
