-- CreateEnum
CREATE TYPE "FraudSignalType" AS ENUM (
  'high_risk_keywords',
  'repeated_listing_duplication',
  'rapid_listing_creation',
  'mismatched_location',
  'multiple_accounts_same_device',
  'flagged_messages',
  'buyer_reports',
  'suspicious_pricing'
);

-- CreateTable
CREATE TABLE "fraud_signals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "signal_type" "FraudSignalType" NOT NULL,
    "signal_value" TEXT NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "dismissed_at" TIMESTAMP(3),
    "escalated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fraud_signals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fraud_signals_user_id_created_at_idx" ON "fraud_signals"("user_id", "created_at" DESC);
CREATE INDEX "fraud_signals_listing_id_created_at_idx" ON "fraud_signals"("listing_id", "created_at" DESC);
CREATE INDEX "fraud_signals_signal_type_created_at_idx" ON "fraud_signals"("signal_type", "created_at" DESC);
CREATE INDEX "fraud_signals_dismissed_at_idx" ON "fraud_signals"("dismissed_at");

ALTER TABLE "fraud_signals" ADD CONSTRAINT "fraud_signals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fraud_signals" ADD CONSTRAINT "fraud_signals_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
