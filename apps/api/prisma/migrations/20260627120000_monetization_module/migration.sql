-- Monetization: platform fees, earn-only cashback wallet

CREATE TYPE "WalletTransactionType" AS ENUM ('cashback_earned', 'expired');
CREATE TYPE "CashbackGrantStatus" AS ENUM ('pending', 'earned', 'cancelled');

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "custom_platform_fee_percent" DECIMAL(5,2);

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "fee_percent_applied" DECIMAL(5,2);

CREATE TABLE IF NOT EXISTS "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "default_platform_fee_percent" DECIMAL(5,2) NOT NULL,
    "cashback_percent" DECIMAL(5,2) NOT NULL,
    "cooling_days" INTEGER NOT NULL,
    "max_cashback_per_order" DECIMAL(12,2) NOT NULL,
    "max_cashback_per_month" DECIMAL(12,2) NOT NULL,
    "cashback_enabled" BOOLEAN NOT NULL,
    "cashback_min_order_amount" DECIMAL(12,2) NOT NULL,
    "allowed_cashback_methods" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "platform_settings" (
    "id",
    "default_platform_fee_percent",
    "cashback_percent",
    "cooling_days",
    "max_cashback_per_order",
    "max_cashback_per_month",
    "cashback_enabled",
    "cashback_min_order_amount",
    "allowed_cashback_methods",
    "updated_at"
) VALUES (
    'default',
    10.00,
    1.50,
    14,
    10.00,
    20.00,
    true,
    5.00,
    '["card"]'::jsonb,
    CURRENT_TIMESTAMP
) ON CONFLICT ("id") DO NOTHING;

CREATE TABLE IF NOT EXISTS "buyer_wallets" (
    "user_id" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyer_wallets_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE IF NOT EXISTS "wallet_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "source_payment_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "credit_source_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "cashback_grants" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "CashbackGrantStatus" NOT NULL DEFAULT 'pending',
    "unlock_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cashback_grants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "cashback_grants_payment_id_key" ON "cashback_grants"("payment_id");
CREATE INDEX IF NOT EXISTS "cashback_grants_status_unlock_at_idx" ON "cashback_grants"("status", "unlock_at");
CREATE INDEX IF NOT EXISTS "cashback_grants_user_id_created_at_idx" ON "cashback_grants"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "wallet_transactions_user_id_created_at_idx" ON "wallet_transactions"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "wallet_transactions_type_expires_at_idx" ON "wallet_transactions"("type", "expires_at");
CREATE INDEX IF NOT EXISTS "wallet_transactions_source_payment_id_idx" ON "wallet_transactions"("source_payment_id");

ALTER TABLE "buyer_wallets" ADD CONSTRAINT "buyer_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_source_payment_id_fkey" FOREIGN KEY ("source_payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_credit_source_id_fkey" FOREIGN KEY ("credit_source_id") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cashback_grants" ADD CONSTRAINT "cashback_grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cashback_grants" ADD CONSTRAINT "cashback_grants_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
