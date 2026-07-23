import { describe, expect, it } from 'vitest';

import {
  DEFAULT_KEYWORD_FILTERS,
  matchImageHint,
  matchKeywordFilters,
  parseKeywordFilters,
} from '@community-marketplace/utils';

describe('keyword filters matcher', () => {
  it('hard-blocks alcohol terms', () => {
    const result = matchKeywordFilters('Selling craft beer and snacks');
    expect(result.tier).toBe('hard');
    expect(result.hardMatches.some((m) => m.category === 'alcohol' && m.term === 'beer')).toBe(
      true,
    );
  });

  it('applies wine-rack allowlist for wine', () => {
    const result = matchKeywordFilters('Empty wine rack for kitchen');
    expect(result.tier).toBe('none');
    expect(result.allowlistApplied.length).toBeGreaterThan(0);
  });

  it('soft-blocks perfume without hard hit', () => {
    const result = matchKeywordFilters('Unused perfume bottle sealed');
    expect(result.tier).toBe('soft');
    expect(result.softMatches).toContain('perfume');
  });

  it('does not match partial word fragments', () => {
    const result = matchKeywordFilters('Hamburger meal deal');
    expect(result.hardMatches.some((m) => m.term === 'ham')).toBe(false);
  });

  it('parses null config to defaults with enforcement off', () => {
    const config = parseKeywordFilters(null);
    expect(config.enabled).toBe(false);
    expect(config.hard.alcohol).toEqual(DEFAULT_KEYWORD_FILTERS.hard.alcohol);
  });

  it('matches image hints in filenames', () => {
    expect(matchImageHint('listing-weapon-photo.jpg')).toContain('weapon');
  });

  it('hard-blocks champagne and common misspellings', () => {
    expect(matchKeywordFilters('Bottle of champagne').tier).toBe('hard');
    expect(matchKeywordFilters('Cold glass of Champaine').tier).toBe('hard');
    expect(matchKeywordFilters('Italian prosecco gift').tier).toBe('hard');
  });

  it('unions new default alcohol terms into stored config', () => {
    const config = parseKeywordFilters({
      enabled: true,
      hard: { alcohol: ['beer', 'wine'] },
    });
    expect(config.hard.alcohol).toContain('beer');
    expect(config.hard.alcohol).toContain('champagne');
    expect(config.hard.alcohol).toContain('champaine');
  });
});
