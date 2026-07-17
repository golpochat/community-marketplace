import {
  AI_MARKETING_FREE_UNITS_MONTHLY,
  AI_MARKETING_UNIT_EUR_COST,
  type AiBillingMethod,
} from '@community-marketplace/types';

export interface ComputeAiBillingInput {
  sellerVerified: boolean;
  freeUnitsUsedThisMonth: number;
  creditUnits: number;
}

export interface ComputeAiBillingResult {
  billingMethod: AiBillingMethod;
  amountEur: number;
  freeUnitsRemainingBefore: number;
}

/** Pure billing decision: free quota first, then wallet at €/unit. */
export function computeAiBilling(
  input: ComputeAiBillingInput,
): ComputeAiBillingResult {
  const freeUnitsRemainingBefore = input.sellerVerified
    ? Math.max(0, AI_MARKETING_FREE_UNITS_MONTHLY - input.freeUnitsUsedThisMonth)
    : 0;

  if (freeUnitsRemainingBefore >= input.creditUnits) {
    return {
      billingMethod: 'free_quota',
      amountEur: 0,
      freeUnitsRemainingBefore,
    };
  }

  return {
    billingMethod: 'wallet',
    amountEur: Number(
      (input.creditUnits * AI_MARKETING_UNIT_EUR_COST).toFixed(2),
    ),
    freeUnitsRemainingBefore,
  };
}
