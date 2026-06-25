export interface PricingComputeInput {
  originalPrice?: number | null;
  salePrice?: number | null;
  price?: number | null;
}

export interface ComputedListingPricing {
  price: number;
  originalPrice?: number;
  salePrice?: number;
  discountPercent?: number;
  savingsAmount?: number;
  hasSaleBadge: boolean;
  badgeLabel?: string;
}

export const MAX_AUTO_APPROVE_DISCOUNT_PERCENT = 80;

export function computeListingPricing(input: PricingComputeInput): ComputedListingPricing {
  const original =
    input.originalPrice != null ? Number(input.originalPrice) : undefined;
  const saleCandidate =
    input.salePrice != null
      ? Number(input.salePrice)
      : input.price != null
        ? Number(input.price)
        : undefined;

  if (saleCandidate == null || saleCandidate < 0) {
    throw new Error('Price cannot be negative');
  }

  if (saleCandidate === 0) {
    return {
      price: 0,
      salePrice: 0,
      hasSaleBadge: false,
    };
  }

  if (original != null && original > 0) {
    if (saleCandidate >= original) {
      throw new Error('Sale price must be lower than original price');
    }
    const discountPercent = Math.round(((original - saleCandidate) / original) * 100);
    const savingsAmount = Math.round((original - saleCandidate) * 100) / 100;
    return {
      price: saleCandidate,
      originalPrice: original,
      salePrice: saleCandidate,
      discountPercent,
      savingsAmount,
      hasSaleBadge: true,
      badgeLabel: buildSaleBadgeLabel(discountPercent, savingsAmount),
    };
  }

  return {
    price: saleCandidate,
    salePrice: saleCandidate,
    hasSaleBadge: false,
  };
}

export function buildSaleBadgeLabel(
  discountPercent?: number,
  savingsAmount?: number,
): string {
  if (discountPercent != null && discountPercent >= 10) {
    return `${discountPercent}% OFF`;
  }
  if (savingsAmount != null && savingsAmount >= 5) {
    return `Save €${savingsAmount.toFixed(0)}`;
  }
  if (discountPercent != null && discountPercent > 0) {
    return 'REDUCED';
  }
  return 'SALE';
}

export function mapListingPricingFields(row: {
  price: { toNumber(): number } | number;
  originalPrice: { toNumber(): number } | number | null;
  salePrice: { toNumber(): number } | number | null;
  discountPercent: number | null;
}) {
  const price = Number(row.price);
  const originalPrice = row.originalPrice != null ? Number(row.originalPrice) : undefined;
  const salePrice = row.salePrice != null ? Number(row.salePrice) : undefined;
  const discountPercent = row.discountPercent ?? undefined;
  const savingsAmount =
    originalPrice != null && salePrice != null
      ? Math.round((originalPrice - salePrice) * 100) / 100
      : undefined;

  return {
    price,
    originalPrice,
    salePrice,
    discountPercent,
    savingsAmount,
    hasSaleBadge: Boolean(originalPrice && salePrice && discountPercent),
    badgeLabel:
      originalPrice && salePrice && discountPercent
        ? buildSaleBadgeLabel(discountPercent, savingsAmount)
        : undefined,
  };
}
