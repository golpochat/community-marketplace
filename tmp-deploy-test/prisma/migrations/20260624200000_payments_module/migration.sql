-- PaymentStatus: completed -> succeeded, add disputed
ALTER TYPE "PaymentStatus" RENAME VALUE 'completed' TO 'succeeded';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'disputed';

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'in_transit', 'paid', 'failed', 'canceled');
CREATE TYPE "LedgerEntryType" AS ENUM ('credit', 'debit');
CREATE TYPE "RefundStatus" AS ENUM ('pending', 'approved', 'rejected', 'processed');
CREATE TYPE "DisputeStatus" AS ENUM ('open', 'under_review', 'won', 'lost', 'closed');

-- AlterTable payments
ALTER TABLE "payments" ADD COLUMN "order_id" TEXT;
ALTER TABLE "payments" ADD COLUMN "platform_fee" DECIMAL(12,2);
ALTER TABLE "payments" ADD COLUMN "provider_refund_id" TEXT;
ALTER TABLE "payments" ADD COLUMN "client_secret" TEXT;
ALTER TABLE "payments" RENAME COLUMN "stripe_payment_intent_id" TO "provider_payment_id";

CREATE INDEX "payments_buyer_id_created_at_idx" ON "payments"("buyer_id", "created_at" DESC);
CREATE INDEX "payments_seller_id_created_at_idx" ON "payments"("seller_id", "created_at" DESC);
CREATE INDEX "payments_status_idx" ON "payments"("status");
CREATE INDEX "payments_provider_payment_id_idx" ON "payments"("provider_payment_id");

-- CreateTable stripe_connect_accounts
CREATE TABLE "stripe_connect_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stripe_account_id" TEXT NOT NULL,
    "charges_enabled" BOOLEAN NOT NULL DEFAULT false,
    "payouts_enabled" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "stripe_connect_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stripe_connect_accounts_user_id_key" ON "stripe_connect_accounts"("user_id");
CREATE UNIQUE INDEX "stripe_connect_accounts_stripe_account_id_key" ON "stripe_connect_accounts"("stripe_account_id");

ALTER TABLE "stripe_connect_accounts" ADD CONSTRAINT "stripe_connect_accounts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable payouts
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "provider_payout_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payouts_seller_id_created_at_idx" ON "payouts"("seller_id", "created_at" DESC);

ALTER TABLE "payouts" ADD CONSTRAINT "payouts_seller_id_fkey"
  FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable ledger_entries
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "reference_id" TEXT,
    "payment_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ledger_entries_user_id_created_at_idx" ON "ledger_entries"("user_id", "created_at" DESC);
CREATE INDEX "ledger_entries_payment_id_idx" ON "ledger_entries"("payment_id");

ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_payment_id_fkey"
  FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable payment_refunds
CREATE TABLE "payment_refunds" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'pending',
    "provider_refund_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payment_refunds_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payment_refunds_payment_id_idx" ON "payment_refunds"("payment_id");
CREATE INDEX "payment_refunds_status_idx" ON "payment_refunds"("status");

ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_payment_id_fkey"
  FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_requested_by_id_fkey"
  FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_approved_by_id_fkey"
  FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable payment_disputes
CREATE TABLE "payment_disputes" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "provider_dispute_id" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'open',
    "reason" TEXT,
    "evidence" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payment_disputes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_disputes_provider_dispute_id_key" ON "payment_disputes"("provider_dispute_id");
CREATE INDEX "payment_disputes_payment_id_idx" ON "payment_disputes"("payment_id");

ALTER TABLE "payment_disputes" ADD CONSTRAINT "payment_disputes_payment_id_fkey"
  FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable payment_audit_logs
CREATE TABLE "payment_audit_logs" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT,
    "actor_id" TEXT,
    "event_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payment_audit_logs_payment_id_created_at_idx" ON "payment_audit_logs"("payment_id", "created_at" DESC);

ALTER TABLE "payment_audit_logs" ADD CONSTRAINT "payment_audit_logs_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable processed_stripe_events
CREATE TABLE "processed_stripe_events" (
    "id" TEXT NOT NULL,
    "stripe_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "processed_stripe_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "processed_stripe_events_stripe_event_id_key" ON "processed_stripe_events"("stripe_event_id");
