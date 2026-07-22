import {
  AI_MARKETING_FREE_UNITS_MONTHLY,
  AI_MARKETING_UNIT_EUR_COST,
  type AiBillingMethod,
} from '@community-marketplace/types';

export interface ComputeAiBillingInput {
  sellerVerified: boolean;
  freeUnitsUsedThisMonth: number;
  creditUnits: number;
  /** Overrides platform default when provided. */
  freeUnitsMonthly?: number;
}

export interface ComputeAiBillingResult {
  billingMethod: AiBillingMethod;
  amountEur: number;
  freeUnitsRemainingBefore: number;
}

/** Pure billing decision: free quota first, then wallet at €/unit.
 * `freeUnitsMonthly` must already be the seller's effective allowance
 * (override or platform default / 0). */
export function computeAiBilling(
  input: ComputeAiBillingInput,
): ComputeAiBillingResult {
  const freeQuotaMonthly =
    input.freeUnitsMonthly ?? AI_MARKETING_FREE_UNITS_MONTHLY;
  // When callers pass an effective freeUnitsMonthly, verification is already
  // baked in (unverified without override → 0). Keep sellerVerified only as a
  // legacy no-op for callers that still pass it.
  const freeUnitsRemainingBefore = Math.max(
    0,
    freeQuotaMonthly - input.freeUnitsUsedThisMonth,
  );

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
