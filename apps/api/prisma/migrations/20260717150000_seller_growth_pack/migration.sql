-- Phase 4: Seller Growth Pack (wallet credit top-up + hub boost discount)
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'credit_topup';
ALTER TYPE "PlatformPurchaseType" ADD VALUE IF NOT EXISTS 'seller_growth_pack';
