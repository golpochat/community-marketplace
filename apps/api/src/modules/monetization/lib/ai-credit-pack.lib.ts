import type { PlatformPurchaseType } from '@community-marketplace/types';

export type AiCreditPackSku = Extract<
  PlatformPurchaseType,
  'ai_credit_2' | 'ai_credit_5' | 'ai_credit_10'
>;

export const AI_CREDIT_PACK_SKUS: AiCreditPackSku[] = [
  'ai_credit_2',
  'ai_credit_5',
  'ai_credit_10',
];

export function isAiCreditPackSku(value: string): value is AiCreditPackSku {
  return AI_CREDIT_PACK_SKUS.includes(value as AiCreditPackSku);
}

export function aiCreditPackLabel(sku: AiCreditPackSku): string {
  switch (sku) {
    case 'ai_credit_2':
      return '€2 AI Credits';
    case 'ai_credit_5':
      return '€5 AI Credits';
    case 'ai_credit_10':
      return '€10 AI Credits';
    default:
      return sku;
  }
}

export function aiCreditPackApproxUnits(walletCreditEur: number): number {
  return Math.round(walletCreditEur / 0.05);
}
