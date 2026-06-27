import type { Prisma } from '@prisma/client';

import type {
  BuyerWalletSummary,
  CashbackGrant,
  CashbackGrantStatus,
  PaymentMethod,
  MonetizationSettings,
  WalletTransaction,
  WalletTransactionType,
} from '@community-marketplace/types';

const DEFAULT_SETTINGS = {
  defaultPlatformFeePercent: 10,
  cashbackPercent: 1.5,
  coolingDays: 14,
  maxCashbackPerOrder: 10,
  maxCashbackPerMonth: 20,
  cashbackEnabled: true,
  cashbackMinOrderAmount: 5,
  allowedCashbackMethods: ['card'] as PaymentMethod[],
};

export function getDefaultPlatformSettings(): Omit<MonetizationSettings, 'id' | 'createdAt' | 'updatedAt'> {
  return { ...DEFAULT_SETTINGS };
}

export function mapPlatformSettings(row: {
  id: string;
  defaultPlatformFeePercent: Prisma.Decimal;
  cashbackPercent: Prisma.Decimal;
  coolingDays: number;
  maxCashbackPerOrder: Prisma.Decimal;
  maxCashbackPerMonth: Prisma.Decimal;
  cashbackEnabled: boolean;
  cashbackMinOrderAmount: Prisma.Decimal;
  allowedCashbackMethods: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): MonetizationSettings {
  return {
    id: row.id,
    defaultPlatformFeePercent: Number(row.defaultPlatformFeePercent),
    cashbackPercent: Number(row.cashbackPercent),
    coolingDays: row.coolingDays,
    maxCashbackPerOrder: Number(row.maxCashbackPerOrder),
    maxCashbackPerMonth: Number(row.maxCashbackPerMonth),
    cashbackEnabled: row.cashbackEnabled,
    cashbackMinOrderAmount: Number(row.cashbackMinOrderAmount),
    allowedCashbackMethods: row.allowedCashbackMethods as PaymentMethod[],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapWalletTransaction(row: {
  id: string;
  userId: string;
  type: string;
  amount: Prisma.Decimal;
  sourcePaymentId: string | null;
  expiresAt: Date | null;
  creditSourceId: string | null;
  createdAt: Date;
}): WalletTransaction {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as WalletTransactionType,
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
}): CashbackGrant {
  return {
    id: row.id,
    userId: row.userId,
    paymentId: row.paymentId,
    amount: Number(row.amount),
    status: row.status as CashbackGrantStatus,
    unlockAt: row.unlockAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function emptyWalletSummary(
  settings: MonetizationSettings,
): BuyerWalletSummary {
  return {
    balance: 0,
    pendingUnlocks: [],
    recentTransactions: [],
    cashbackPercent: settings.cashbackPercent,
    coolingDays: settings.coolingDays,
    cashbackEnabled: settings.cashbackEnabled,
  };
}
