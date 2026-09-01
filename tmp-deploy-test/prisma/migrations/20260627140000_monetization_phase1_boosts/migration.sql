-- Phase 1: paid listing boosts + platform purchases

CREATE TYPE "PlatformPurchaseType" AS ENUM ('listing_boost');
CREATE TYPE "PlatformPurchaseStatus" AS ENUM ('pending', 'succeeded', 'failed', 'refunded');

ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "verified_seller_fee_percent" DECIMAL(5,2) NOT NULL DEFAULT 8.00,
  ADD COLUMN IF NOT EXISTS "pricing" JSONB,
  ADD COLUMN IF NOT EXISTS "boosts_enabled" BOOLEAN NOT NULL DEFAULT true;

UPDATE "platform_settings"
SET "pricing" = '{
  "currency": "EUR",
  "skus": {
    "boost_7d": { "amount": 1.99, "enabled": true },
    "boost_30d": { "amount": 4.99, "enabled": true }
  },
  "promos": { "first_boost_discount_percent": 50 },
  "featured": { "homepage_slots_per_day": 8 }
}'::jsonb
WHERE "id" = 'default' AND "pricing" IS NULL;

CREATE TABLE IF NOT EXISTS "platform_purchases" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "PlatformPurchaseType" NOT NULL,
    "status" "PlatformPurchaseStatus" NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "listing_id" TEXT,
    "package_type" "ListingPackageType",
    "provider_payment_id" TEXT,
    "client_secret" TEXT,
    "metadata" JSONB,
    "fulfilled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_purchases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "platform_purchases_user_id_created_at_idx"
  ON "platform_purchases"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "platform_purchases_listing_id_idx"
  ON "platform_purchases"("listing_id");
CREATE INDEX IF NOT EXISTS "platform_purchases_provider_payment_id_idx"
  ON "platform_purchases"("provider_payment_id");
CREATE INDEX IF NOT EXISTS "platform_purchases_status_idx"
  ON "platform_purchases"("status");

ALTER TABLE "platform_purchases"
  ADD CONSTRAINT "platform_purchases_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "platform_purchases"
  ADD CONSTRAINT "platform_purchases_listing_id_fkey"
  FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
