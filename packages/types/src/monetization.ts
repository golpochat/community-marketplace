import type { PaymentMethod } from './payment';

export type WalletTransactionType = 'cashback_earned' | 'expired';

export type CashbackGrantStatus = 'pending' | 'earned' | 'cancelled';

export interface MonetizationSettings {
  id: string;
  defaultPlatformFeePercent: number;
  cashbackPercent: number;
  coolingDays: number;
  maxCashbackPerOrder: number;
  maxCashbackPerMonth: number;
  cashbackEnabled: boolean;
  cashbackMinOrderAmount: number;
  allowedCashbackMethods: PaymentMethod[];
  createdAt: string;
  updatedAt: string;
}

export interface SellerPlatformFeeInfo {
  effectiveFeePercent: number;
  isCustomOverride: boolean;
  defaultFeePercent: number;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTransactionType;
  amount: number;
  sourcePaymentId?: string;
  expiresAt?: string;
  creditSourceId?: string;
  createdAt: string;
}

export interface CashbackGrant {
  id: string;
  userId: string;
  paymentId: string;
  amount: number;
  status: CashbackGrantStatus;
  unlockAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingCashbackUnlock {
  grantId: string;
  paymentId: string;
  amount: number;
  unlockAt: string;
}

export interface BuyerWalletSummary {
  balance: number;
  pendingUnlocks: PendingCashbackUnlock[];
  recentTransactions: WalletTransaction[];
  cashbackPercent: number;
  coolingDays: number;
  cashbackEnabled: boolean;
}

export interface CashbackEstimate {
  eligible: boolean;
  amount: number;
  unlockAt: string;
  cashbackPercent: number;
  reason?: string;
}
