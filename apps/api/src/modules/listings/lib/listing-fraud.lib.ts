const HIGH_VALUE_PATTERN =
  /\b(iphone|macbook|laptop|ps5|xbox|rolex|watch|mercedes|bmw|audi|tesla|vehicle|car|van|camera|ipad|samsung galaxy)\b/i;

const NEW_SELLER_DAILY_LISTING_LIMIT = 5;
const NEW_SELLER_ACCOUNT_DAYS = 30;

export interface FraudCheckInput {
  title: string;
  price: number;
  recentTitles: string[];
}

export function detectListingFraudSignals(input: FraudCheckInput): {
  requiresReview: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const normalizedTitle = input.title.trim().toLowerCase();

  if (input.price > 0 && input.price < 50 && HIGH_VALUE_PATTERN.test(input.title)) {
    reasons.push('Price unusually low for a high-value item');
  }

  const duplicateCount = input.recentTitles.filter(
    (title) => title.trim().toLowerCase() === normalizedTitle,
  ).length;
  if (duplicateCount >= 1) {
    reasons.push('Repeated copy-paste listing title');
  }

  return { requiresReview: reasons.length > 0, reasons };
}

export function isNewSellerAccount(createdAt: Date): boolean {
  const ageMs = Date.now() - createdAt.getTime();
  return ageMs < NEW_SELLER_ACCOUNT_DAYS * 24 * 60 * 60 * 1000;
}

export { NEW_SELLER_DAILY_LISTING_LIMIT };
