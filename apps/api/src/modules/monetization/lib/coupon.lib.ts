import type { CouponDiscountType, PlatformPurchaseType } from '@community-marketplace/types';

import { roundMoney } from './boost.lib';

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export function quoteCouponDiscount(input: {
  discountType: CouponDiscountType;
  discountValue: number;
  baseAmount: number;
}): { finalAmount: number; amountSaved: number } {
  const base = roundMoney(Math.max(0, input.baseAmount));
  const value = Number(input.discountValue);
  if (!Number.isFinite(value) || value <= 0 || base <= 0) {
    return { finalAmount: base, amountSaved: 0 };
  }

  let amountSaved = 0;
  if (input.discountType === 'percent') {
    const percent = Math.min(100, value);
    amountSaved = roundMoney(base * (percent / 100));
  } else {
    amountSaved = roundMoney(Math.min(base, value));
  }

  const finalAmount = roundMoney(Math.max(0, base - amountSaved));
  return { finalAmount, amountSaved: roundMoney(base - finalAmount) };
}

export function isPurchaseTypeAllowed(
  allowedPurchaseTypes: unknown,
  purchaseType: PlatformPurchaseType,
): boolean {
  if (!Array.isArray(allowedPurchaseTypes) || allowedPurchaseTypes.length === 0) {
    return true;
  }
  return allowedPurchaseTypes.includes(purchaseType);
}
