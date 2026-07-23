import type { KeywordHardCategory, KeywordMatchResult } from '@community-marketplace/types';

/** Public policy path for prohibited items (relative to web app origin). */
export const PROHIBITED_ITEMS_POLICY_PATH = '/policies/prohibited-items';

export type ProhibitedErrorCode =
  | 'PROHIBITED_ALCOHOL'
  | 'PROHIBITED_PORK'
  | 'PROHIBITED_ADULT'
  | 'PROHIBITED_GAMBLING'
  | 'PROHIBITED_INTOXICANT'
  | 'PROHIBITED_WEAPON'
  | 'PROHIBITED_ILLEGAL'
  | 'SOFT_BLOCK_REVIEW'
  | 'IMAGE_FLAG_ALCOHOL'
  | 'IMAGE_FLAG_PORK'
  | 'IMAGE_FLAG_ADULT'
  | 'IMAGE_FLAG_GAMBLING'
  | 'IMAGE_FLAG_INTOXICANT'
  | 'IMAGE_FLAG_WEAPON'
  | 'IMAGE_FLAG_ILLEGAL'
  | 'IMAGE_FLAG_PROHIBITED';

const HARD_CATEGORY_CODES: Record<KeywordHardCategory, ProhibitedErrorCode> = {
  alcohol: 'PROHIBITED_ALCOHOL',
  pork: 'PROHIBITED_PORK',
  adult: 'PROHIBITED_ADULT',
  gambling: 'PROHIBITED_GAMBLING',
  intoxicants: 'PROHIBITED_INTOXICANT',
  weapons: 'PROHIBITED_WEAPON',
  fraud_illegal: 'PROHIBITED_ILLEGAL',
};

function imageHintCode(hint: string): ProhibitedErrorCode {
  const h = hint.toLowerCase();
  if (
    [
      'alcohol',
      'beer',
      'wine',
      'vodka',
      'whiskey',
      'whisky',
      'gin',
      'rum',
      'tequila',
      'champagne',
      'prosecco',
      'cava',
    ].includes(h)
  ) {
    return 'IMAGE_FLAG_ALCOHOL';
  }
  if (['pork', 'bacon', 'ham'].includes(h)) return 'IMAGE_FLAG_PORK';
  if (['adult', 'xxx', 'porn'].includes(h)) return 'IMAGE_FLAG_ADULT';
  if (['gambling', 'casino'].includes(h)) return 'IMAGE_FLAG_GAMBLING';
  if (
    ['drug', 'cannabis', 'marijuana', 'vape', 'tobacco', 'cigarette'].includes(h)
  ) {
    return 'IMAGE_FLAG_INTOXICANT';
  }
  if (['weapon', 'gun', 'firearm', 'knife-blade'].includes(h)) {
    return 'IMAGE_FLAG_WEAPON';
  }
  if (['counterfeit', 'fake-id', 'replica-rolex'].includes(h)) {
    return 'IMAGE_FLAG_ILLEGAL';
  }
  return 'IMAGE_FLAG_PROHIBITED';
}

export function hardBlockErrorCode(match: KeywordMatchResult): ProhibitedErrorCode {
  const category = match.hardMatches[0]?.category;
  return category ? HARD_CATEGORY_CODES[category] : 'PROHIBITED_ILLEGAL';
}

export function imageFlagErrorCode(hints: string[]): ProhibitedErrorCode {
  if (hints.length === 0) return 'IMAGE_FLAG_PROHIBITED';
  return imageHintCode(hints[0]!);
}

export function prohibitedErrorPayload(input: {
  code: ProhibitedErrorCode;
  message: string;
  details?: Record<string, unknown>;
}) {
  return {
    code: input.code,
    message: input.message,
    policyUrl: PROHIBITED_ITEMS_POLICY_PATH,
    ...(input.details ? { details: input.details } : {}),
  };
}
