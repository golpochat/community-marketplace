-- AI Marketing Hub Phase 0/1: wallet debit type + generation audit log

ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'ai_generation';

CREATE TYPE "AiMarketingTask" AS ENUM ('seo_title', 'description');
CREATE TYPE "AiBillingMethod" AS ENUM ('free_quota', 'wallet');

CREATE TABLE "ai_generation_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "task" "AiMarketingTask" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "billing_method" "AiBillingMethod" NOT NULL,
    "credit_units" INTEGER NOT NULL,
    "amount_eur" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "wallet_transaction_id" TEXT,
    "input_summary" TEXT,
    "output_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generation_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_generation_logs_wallet_transaction_id_key" ON "ai_generation_logs"("wallet_transaction_id");
CREATE INDEX "ai_generation_logs_user_id_created_at_idx" ON "ai_generation_logs"("user_id", "created_at" DESC);
CREATE INDEX "ai_generation_logs_listing_id_idx" ON "ai_generation_logs"("listing_id");

ALTER TABLE "ai_generation_logs" ADD CONSTRAINT "ai_generation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_generation_logs" ADD CONSTRAINT "ai_generation_logs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_generation_logs" ADD CONSTRAINT "ai_generation_logs_wallet_transaction_id_fkey" FOREIGN KEY ("wallet_transaction_id") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
