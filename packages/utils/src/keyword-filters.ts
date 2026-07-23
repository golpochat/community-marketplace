import type {
  KeywordAllowlistRule,
  KeywordFiltersConfig,
  KeywordHardCategory,
  KeywordHardMatch,
  KeywordMatchResult,
} from '@community-marketplace/types';

const HARD_CATEGORIES: KeywordHardCategory[] = [
  'alcohol',
  'pork',
  'adult',
  'gambling',
  'intoxicants',
  'weapons',
  'fraud_illegal',
];

/** Defaults from master-blueprint §7.1–7.4. */
export const DEFAULT_KEYWORD_FILTERS: KeywordFiltersConfig = {
  enabled: false,
  hard: {
    alcohol: [
      'beer',
      'wine',
      'vodka',
      'whiskey',
      'whisky',
      'gin',
      'rum',
      'tequila',
      'cider',
      'lager',
      'stout',
      'champagne',
      'champaine',
      'prosecco',
      'cava',
      'alcohol',
      'alcoholic',
      'spirits',
      'liquor',
      'moonshine',
      'brewery kit',
      'homebrew kit',
    ],
    pork: ['pork', 'bacon', 'ham', 'lard', 'pork fat', 'gammon'],
    adult: [
      'sex toy',
      'dildo',
      'vibrator',
      'adult toy',
      'porn',
      'xxx',
      'erotic',
      'fetish',
      'bdsm',
    ],
    gambling: [
      'casino',
      'slot machine',
      'roulette',
      'poker chips',
      'betting tokens',
      'gambling',
      'lottery resale',
    ],
    intoxicants: [
      'weed',
      'cannabis',
      'marijuana',
      'hash',
      'vape',
      'e-cigarette',
      'nicotine',
      'shisha',
      'hookah',
      'tobacco',
      'rolling papers',
      'bong',
    ],
    weapons: [
      'gun',
      'firearm',
      'pistol',
      'rifle',
      'shotgun',
      'ammo',
      'ammunition',
      'taser',
      'pepper spray',
      'switchblade',
      'machete',
    ],
    fraud_illegal: [
      'fake id',
      'counterfeit',
      'replica designer',
      'stolen',
      'hacked',
      'cracked',
      'pirated',
    ],
  },
  soft: [
    'perfume',
    'aftershave',
    'cologne',
    'fragrance',
    'eau de toilette',
    'herbal',
    'supplement',
    'vitamins',
    'empty bottle',
    'collectible bottle',
    'cbd',
    'hemp oil',
    'ashtray',
    'lighter',
  ],
  allowlist: [
    { ifContains: ['wine rack'], ignoreHardTerms: ['wine'] },
    { ifContains: ['beer mug', 'beer glass'], ignoreHardTerms: ['beer'] },
    { ifContains: ['piggy bank'], ignoreHardTerms: ['pork'] },
    { ifContains: ['kitchen knife', 'knife set'], ignoreHardTerms: ['switchblade', 'machete'] },
    { ifContains: ['cbd skincare', 'cbd cream', 'cbd balm'], ignoreHardTerms: [] },
  ],
  imageHints: [
    'alcohol',
    'beer',
    'wine',
    'vodka',
    'whiskey',
    'champagne',
    'prosecco',
    'pork',
    'bacon',
    'ham',
    'weapon',
    'gun',
    'firearm',
    'knife-blade',
    'drug',
    'cannabis',
    'marijuana',
    'vape',
    'tobacco',
    'cigarette',
    'adult',
    'xxx',
    'porn',
    'gambling',
    'casino',
    'counterfeit',
    'fake-id',
    'replica-rolex',
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

/** Keep stored admin terms and always include current defaults. */
function unionTerms(defaults: string[], stored: string[]): string[] {
  return [...new Set([...defaults, ...stored])];
}

function parseAllowlist(value: unknown): KeywordAllowlistRule[] {
  if (!Array.isArray(value)) return DEFAULT_KEYWORD_FILTERS.allowlist;
  const rules: KeywordAllowlistRule[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const ifContains = asStringArray(item.ifContains);
    const ignoreHardTerms = asStringArray(item.ignoreHardTerms);
    if (ifContains.length === 0) continue;
    rules.push({ ifContains, ignoreHardTerms });
  }
  return rules.length > 0 ? rules : DEFAULT_KEYWORD_FILTERS.allowlist;
}

function parseHard(value: unknown): KeywordFiltersConfig['hard'] {
  const base = structuredClone(DEFAULT_KEYWORD_FILTERS.hard);
  if (!isRecord(value)) return base;
  for (const category of HARD_CATEGORIES) {
    if (category in value) {
      const terms = asStringArray(value[category]);
      if (terms.length > 0) {
        base[category] = unionTerms(DEFAULT_KEYWORD_FILTERS.hard[category], terms);
      }
    }
  }
  return base;
}

export function parseKeywordFilters(value: unknown): KeywordFiltersConfig {
  if (!isRecord(value)) {
    return structuredClone(DEFAULT_KEYWORD_FILTERS);
  }
  return {
    enabled: value.enabled === true,
    hard: parseHard(value.hard),
    soft: (() => {
      const soft = asStringArray(value.soft);
      return soft.length > 0
        ? unionTerms(DEFAULT_KEYWORD_FILTERS.soft, soft)
        : [...DEFAULT_KEYWORD_FILTERS.soft];
    })(),
    allowlist: parseAllowlist(value.allowlist),
    imageHints: (() => {
      const hints = asStringArray(value.imageHints);
      return hints.length > 0
        ? unionTerms(DEFAULT_KEYWORD_FILTERS.imageHints, hints)
        : [...DEFAULT_KEYWORD_FILTERS.imageHints];
    })(),
  };
}

export function normalizeFilterText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Match whole words/phrases with simple boundaries. */
export function textContainsTerm(haystack: string, term: string): boolean {
  const normalizedTerm = normalizeFilterText(term);
  if (!normalizedTerm) return false;
  const pattern = new RegExp(`(?:^|\\s)${escapeRegExp(normalizedTerm)}(?:\\s|$)`, 'i');
  return pattern.test(` ${haystack} `);
}

function allowlistLabel(rule: KeywordAllowlistRule): string {
  return rule.ifContains.join(' + ');
}

/**
 * Evaluate listing/chat text against keyword filter config.
 * Does not consult `enabled` — callers decide whether to enforce.
 */
export function matchKeywordFilters(
  text: string,
  config: KeywordFiltersConfig = DEFAULT_KEYWORD_FILTERS,
): KeywordMatchResult {
  const normalized = normalizeFilterText(text);
  if (!normalized) {
    return { tier: 'none', hardMatches: [], softMatches: [], allowlistApplied: [] };
  }

  const hardMatches: KeywordHardMatch[] = [];
  for (const category of HARD_CATEGORIES) {
    for (const term of config.hard[category] ?? []) {
      if (textContainsTerm(normalized, term)) {
        hardMatches.push({ category, term });
      }
    }
  }

  const allowlistApplied: string[] = [];
  const suppressed = new Set<string>();
  for (const rule of config.allowlist) {
    const hits = rule.ifContains.every((phrase) => textContainsTerm(normalized, phrase));
    if (!hits) continue;
    allowlistApplied.push(allowlistLabel(rule));
    for (const term of rule.ignoreHardTerms) {
      suppressed.add(normalizeFilterText(term));
    }
  }

  const filteredHard = hardMatches.filter(
    (match) => !suppressed.has(normalizeFilterText(match.term)),
  );

  const softMatches = config.soft.filter((term) => textContainsTerm(normalized, term));

  if (filteredHard.length > 0) {
    return {
      tier: 'hard',
      hardMatches: filteredHard,
      softMatches,
      allowlistApplied,
    };
  }

  if (softMatches.length > 0) {
    return {
      tier: 'soft',
      hardMatches: [],
      softMatches,
      allowlistApplied,
    };
  }

  return { tier: 'none', hardMatches: [], softMatches: [], allowlistApplied };
}

export function matchImageHint(
  filenameOrCaption: string,
  config: KeywordFiltersConfig = DEFAULT_KEYWORD_FILTERS,
): string[] {
  const normalized = normalizeFilterText(filenameOrCaption);
  if (!normalized) return [];
  return config.imageHints.filter((hint) => normalized.includes(normalizeFilterText(hint)));
}
