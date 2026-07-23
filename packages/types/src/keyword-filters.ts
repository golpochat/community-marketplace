/** Prohibited / restricted content filter config (haram + illegal policy). */

export type KeywordHardCategory =
  | 'alcohol'
  | 'pork'
  | 'adult'
  | 'gambling'
  | 'intoxicants'
  | 'weapons'
  | 'fraud_illegal';

export interface KeywordAllowlistRule {
  /** If all of these phrases appear (case-insensitive), suppress listed hard terms. */
  ifContains: string[];
  /** Hard terms to ignore when the allowlist rule matches. */
  ignoreHardTerms: string[];
}

export interface KeywordFiltersConfig {
  /**
   * Master switch for listing create/update enforcement (Phase B+).
   * Phase A ships config + matcher only; keep false until wired.
   */
  enabled: boolean;
  /** Category → hard-block terms (auto-reject when enabled). */
  hard: Record<KeywordHardCategory, string[]>;
  /** Soft-block terms (force pending_review when enabled). */
  soft: string[];
  /** Contextual exceptions for hard matches. */
  allowlist: KeywordAllowlistRule[];
  /** Filename / caption hints for image pause+queue (Phase D). */
  imageHints: string[];
}

export type KeywordMatchTier = 'hard' | 'soft' | 'none';

export interface KeywordHardMatch {
  category: KeywordHardCategory;
  term: string;
}

export interface KeywordMatchResult {
  tier: KeywordMatchTier;
  hardMatches: KeywordHardMatch[];
  softMatches: string[];
  /** Allowlist rules that suppressed one or more hard hits. */
  allowlistApplied: string[];
}
