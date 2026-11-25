import type { Prisma } from '@prisma/client';

import type {
  MonetizationSettings,
  PaymentMethod,
  PlatformPricingConfig,
  PlatformPurchase,
  PlatformSkuConfig,
} from '@community-marketplace/types';
import { DEFAULT_KEYWORD_FILTERS, parseKeywordFilters } from '@community-marketplace/utils';

import {
  DEFAULT_PLATFORM_PRICING,
  mapPlatformPurchase,
  parsePlatformPricing,
  roundMoney,
} from '../lib/boost.lib';

const DEFAULT_SETTINGS = {
  defaultPlatformFeePercent: 10,
  verifiedSellerFeePercent: 8,
  cashbackPercent: 1.5,
  coolingDays: 14,
  maxCashbackPerOrder: 10,
  maxCashbackPerMonth: 20,
  cashbackEnabled: true,
  cashbackMinOrderAmount: 5,
  allowedCashbackMethods: ['card'] as PaymentMethod[],
  pricing: DEFAULT_PLATFORM_PRICING,
  keywordFilters: DEFAULT_KEYWORD_FILTERS,
  boostsEnabled: true,
  featuredEnabled: true,
  displayAdsEnabled: false,
  aiMarketingEnabled: false,
  aiMarketingFreeUnitsMonthly: 10,
};

export function getDefaultPlatformSettings(): Omit<
  MonetizationSettings,
  'id' | 'createdAt' | 'updatedAt'
> {
  return { ...DEFAULT_SETTINGS };
}

export function mapPlatformSettings(row: {
  id: string;
  defaultPlatformFeePercent: Prisma.Decimal;
  verifiedSellerFeePercent: Prisma.Decimal;
  cashbackPercent: Prisma.Decimal;
  coolingDays: number;
  maxCashbackPerOrder: Prisma.Decimal;
  maxCashbackPerMonth: Prisma.Decimal;
  cashbackEnabled: boolean;
  cashbackMinOrderAmount: Prisma.Decimal;
  allowedCashbackMethods: Prisma.JsonValue;
  pricing: Prisma.JsonValue | null;
  keywordFilters?: Prisma.JsonValue | null;
  boostsEnabled: boolean;
  featuredEnabled: boolean;
  displayAdsEnabled: boolean;
  aiMarketingEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}): MonetizationSettings {
  const pricing = parsePlatformPricing(row.pricing);
  return {
    id: row.id,
    defaultPlatformFeePercent: Number(row.defaultPlatformFeePercent),
    verifiedSellerFeePercent: Number(row.verifiedSellerFeePercent),
    cashbackPercent: Number(row.cashbackPercent),
    coolingDays: row.coolingDays,
    maxCashbackPerOrder: Number(row.maxCashbackPerOrder),
    maxCashbackPerMonth: Number(row.maxCashbackPerMonth),
    cashbackEnabled: row.cashbackEnabled,
    cashbackMinOrderAmount: Number(row.cashbackMinOrderAmount),
    allowedCashbackMethods: row.allowedCashbackMethods as PaymentMethod[],
    pricing,
    keywordFilters: parseKeywordFilters(row.keywordFilters ?? null),
    boostsEnabled: row.boostsEnabled,
    featuredEnabled: row.featuredEnabled,
    displayAdsEnabled: row.displayAdsEnabled,
    aiMarketingEnabled: row.aiMarketingEnabled,
    aiMarketingFreeUnitsMonthly:
      pricing.aiMarketing?.freeUnitsMonthly ??
      DEFAULT_SETTINGS.aiMarketingFreeUnitsMonthly,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

type SkuPatch = {
  amount?: number;
  enabled?: boolean;
  walletCreditEur?: number;
  boostDiscountPercent?: number;
};

type PricingMergeInput = {
  pricing?: {
    skus?: Partial<Record<keyof PlatformPricingConfig['skus'], SkuPatch>>;
    promos?: { first_boost_discount_percent?: number };
    featured?: {
      homepage_slots_per_day?: number;
      category_slots_per_day?: number;
      store_homepage_slots_per_day?: number;
    };
    shopShelf?: {
      primaryFreeLive?: number;
      extraStoreFreeLive?: number;
      earnBackExtraDays?: number;
      enforceHardCap?: boolean;
    };
    aiMarketing?: { freeUnitsMonthly?: number };
  };
  boostPrice7d?: number;
  boostPrice30d?: number;
  featuredHomepagePrice?: number;
  featuredCategoryPrice?: number;
  fastTrackVerificationPrice?: number;
  storeSlot2Price?: number;
  storeSlot3Price?: number;
  storeBundle3Price?: number;
  homepageSlotsPerDay?: number;
  categorySlotsPerDay?: number;
  aiMarketingFreeUnitsMonthly?: number;
};

function applySkuPatch(
  current: PlatformPricingConfig['skus'][keyof PlatformPricingConfig['skus']],
  patch: SkuPatch | undefined,
  fallbackEnabled = true,
): PlatformSkuConfig & SkuPatch {
  const base = current ?? { amount: 0, enabled: fallbackEnabled };
  const next: PlatformSkuConfig & SkuPatch = { ...base };
  if (patch?.amount !== undefined) next.amount = roundMoney(patch.amount);
  if (patch?.enabled !== undefined) next.enabled = patch.enabled;
  if (patch?.walletCreditEur !== undefined) {
    next.walletCreditEur = roundMoney(patch.walletCreditEur);
  }
  if (patch?.boostDiscountPercent !== undefined) {
    next.boostDiscountPercent = Math.min(
      100,
      Math.max(0, Math.floor(patch.boostDiscountPercent)),
    );
  }
  return next;
}

export function mergePricingUpdate(
  current: PlatformPricingConfig,
  input: PricingMergeInput,
): PlatformPricingConfig {
  const next: PlatformPricingConfig = {
    ...current,
    skus: { ...current.skus },
    featured: { ...current.featured },
    promos: { ...current.promos },
    shopShelf: {
      ...(DEFAULT_PLATFORM_PRICING.shopShelf!),
      ...(current.shopShelf ?? {}),
    },
    aiMarketing: {
      freeUnitsMonthly:
        current.aiMarketing?.freeUnitsMonthly ??
        DEFAULT_PLATFORM_PRICING.aiMarketing!.freeUnitsMonthly,
    },
  };

  const nested = input.pricing;
  if (nested?.skus) {
    for (const [key, patch] of Object.entries(nested.skus)) {
      if (!patch) continue;
      const skuKey = key as keyof PlatformPricingConfig['skus'];
      next.skus[skuKey] = applySkuPatch(next.skus[skuKey], patch) as never;
    }
  }
  if (nested?.promos?.first_boost_discount_percent !== undefined) {
    next.promos = {
      ...next.promos,
      first_boost_discount_percent: nested.promos.first_boost_discount_percent,
    };
  }
  if (nested?.featured) {
    next.featured = {
      ...next.featured,
      ...(nested.featured.homepage_slots_per_day !== undefined
        ? { homepage_slots_per_day: nested.featured.homepage_slots_per_day }
        : {}),
      ...(nested.featured.category_slots_per_day !== undefined
        ? { category_slots_per_day: nested.featured.category_slots_per_day }
        : {}),
      ...(nested.featured.store_homepage_slots_per_day !== undefined
        ? { store_homepage_slots_per_day: nested.featured.store_homepage_slots_per_day }
        : {}),
    };
  }
  if (nested?.shopShelf) {
    next.shopShelf = {
      ...next.shopShelf!,
      ...(nested.shopShelf.primaryFreeLive !== undefined
        ? { primaryFreeLive: nested.shopShelf.primaryFreeLive }
        : {}),
      ...(nested.shopShelf.extraStoreFreeLive !== undefined
        ? { extraStoreFreeLive: nested.shopShelf.extraStoreFreeLive }
        : {}),
      ...(nested.shopShelf.earnBackExtraDays !== undefined
        ? { earnBackExtraDays: nested.shopShelf.earnBackExtraDays }
        : {}),
      ...(nested.shopShelf.enforceHardCap !== undefined
        ? { enforceHardCap: nested.shopShelf.enforceHardCap }
        : {}),
    };
  }
  if (nested?.aiMarketing?.freeUnitsMonthly !== undefined) {
    next.aiMarketing = {
      freeUnitsMonthly: Math.min(
        500,
        Math.max(0, Math.floor(nested.aiMarketing.freeUnitsMonthly)),
      ),
    };
  }

  if (input.aiMarketingFreeUnitsMonthly !== undefined) {
    next.aiMarketing = {
      freeUnitsMonthly: Math.min(
        500,
        Math.max(0, Math.floor(input.aiMarketingFreeUnitsMonthly)),
      ),
    };
  }
  if (input.boostPrice7d !== undefined) {
    next.skus.boost_7d = applySkuPatch(next.skus.boost_7d, { amount: input.boostPrice7d });
  }
  if (input.boostPrice30d !== undefined) {
    next.skus.boost_30d = applySkuPatch(next.skus.boost_30d, { amount: input.boostPrice30d });
  }
  if (input.featuredHomepagePrice !== undefined) {
    next.skus.featured_homepage = applySkuPatch(next.skus.featured_homepage, {
      amount: input.featuredHomepagePrice,
    });
  }
  if (input.featuredCategoryPrice !== undefined) {
    next.skus.featured_category = applySkuPatch(next.skus.featured_category, {
      amount: input.featuredCategoryPrice,
    });
  }
  if (input.fastTrackVerificationPrice !== undefined) {
    next.skus.fast_track_verification = applySkuPatch(next.skus.fast_track_verification, {
      amount: input.fastTrackVerificationPrice,
    });
  }
  if (input.storeSlot2Price !== undefined) {
    next.skus.store_slot_2 = applySkuPatch(next.skus.store_slot_2, {
      amount: input.storeSlot2Price,
    });
  }
  if (input.storeSlot3Price !== undefined) {
    next.skus.store_slot_3 = applySkuPatch(next.skus.store_slot_3, {
      amount: input.storeSlot3Price,
    });
  }
  if (input.storeBundle3Price !== undefined) {
    next.skus.store_bundle_3 = applySkuPatch(next.skus.store_bundle_3, {
      amount: input.storeBundle3Price,
    });
  }
  if (input.homepageSlotsPerDay !== undefined) {
    next.featured = {
      ...next.featured,
      homepage_slots_per_day: input.homepageSlotsPerDay,
    };
  }
  if (input.categorySlotsPerDay !== undefined) {
    next.featured = {
      ...next.featured,
      category_slots_per_day: input.categorySlotsPerDay,
    };
  }
  return next;
}

export { mapPlatformPurchase, roundMoney };

export function mapWalletTransaction(row: {
  id: string;
  userId: string;
  type: string;
  amount: Prisma.Decimal;
  sourcePaymentId: string | null;
  expiresAt: Date | null;
  creditSourceId: string | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as 'cashback_earned' | 'expired' | 'ai_generation' | 'credit_topup',
    amount: Number(row.amount),
    sourcePaymentId: row.sourcePaymentId ?? undefined,
    expiresAt: row.expiresAt?.toISOString(),
    creditSourceId: row.creditSourceId ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapCashbackGrant(row: {
  id: string;
  userId: string;
  paymentId: string;
  amount: Prisma.Decimal;
  status: string;
  unlockAt: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    userId: row.userId,
    paymentId: row.paymentId,
    amount: Number(row.amount),
    status: row.status as 'pending' | 'earned' | 'cancelled',
    unlockAt: row.unlockAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function emptyWalletSummary(settings: MonetizationSettings) {
  const earlySku = settings.pricing.skus.early_cashback_unlock;
  return {
    balance: 0,
    pendingUnlocks: [],
    recentTransactions: [],
    cashbackPercent: settings.cashbackPercent,
    coolingDays: settings.coolingDays,
    cashbackEnabled: settings.cashbackEnabled,
    earlyUnlock: {
      enabled: Boolean(earlySku?.enabled),
      price: Number(earlySku?.amount ?? 0.99),
      currency: settings.pricing.currency.toUpperCase(),
    },
  };
}
