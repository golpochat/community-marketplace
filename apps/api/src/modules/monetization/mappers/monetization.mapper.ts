import type { Prisma } from '@prisma/client';

import type {
  MonetizationSettings,
  PaymentMethod,
  PlatformPricingConfig,
  PlatformPurchase,
} from '@community-marketplace/types';

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
  boostsEnabled: true,
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
  boostsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}): MonetizationSettings {
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
    pricing: parsePlatformPricing(row.pricing),
    boostsEnabled: row.boostsEnabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mergePricingUpdate(
  current: PlatformPricingConfig,
  input: {
    boostPrice7d?: number;
    boostPrice30d?: number;
  },
): PlatformPricingConfig {
  const next = { ...current, skus: { ...current.skus } };
  if (input.boostPrice7d !== undefined) {
    next.skus.boost_7d = { ...next.skus.boost_7d, amount: roundMoney(input.boostPrice7d) };
  }
  if (input.boostPrice30d !== undefined) {
    next.skus.boost_30d = { ...next.skus.boost_30d, amount: roundMoney(input.boostPrice30d) };
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
    type: row.type as 'cashback_earned' | 'expired',
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
  return {
    balance: 0,
    pendingUnlocks: [],
    recentTransactions: [],
    cashbackPercent: settings.cashbackPercent,
    coolingDays: settings.coolingDays,
    cashbackEnabled: settings.cashbackEnabled,
  };
}
