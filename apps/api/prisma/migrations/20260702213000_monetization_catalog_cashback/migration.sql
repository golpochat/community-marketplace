-- Monetization product catalog + buyer cashback rules

CREATE TYPE "MonetizationProductType" AS ENUM ('listing_boost', 'featured_slot');
CREATE TYPE "MonetizationProductStatus" AS ENUM ('draft', 'published', 'archived');
CREATE TYPE "BuyerCashbackRuleScope" AS ENUM ('platform_default', 'buyer');

CREATE TABLE "monetization_products" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "MonetizationProductType" NOT NULL,
    "status" "MonetizationProductStatus" NOT NULL DEFAULT 'draft',
    "price" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "duration_days" INTEGER,
    "duration_hours" INTEGER,
    "placement" VARCHAR(64),
    "package_type" "ListingPackageType",
    "slots_per_day" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monetization_products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "monetization_products_code_key" ON "monetization_products"("code");
CREATE INDEX "monetization_products_type_status_sort_order_idx" ON "monetization_products"("type", "status", "sort_order");

CREATE TABLE "buyer_cashback_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "BuyerCashbackRuleScope" NOT NULL,
    "buyer_id" TEXT,
    "percent" DECIMAL(5,2) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyer_cashback_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "buyer_cashback_rules_scope_enabled_idx" ON "buyer_cashback_rules"("scope", "enabled");
CREATE INDEX "buyer_cashback_rules_buyer_id_idx" ON "buyer_cashback_rules"("buyer_id");

ALTER TABLE "buyer_cashback_rules" ADD CONSTRAINT "buyer_cashback_rules_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed catalog from current platform defaults (published when module toggles are on)
INSERT INTO "monetization_products" (
    "id", "code", "name", "description", "type", "status", "price", "currency",
    "duration_days", "duration_hours", "placement", "package_type", "slots_per_day", "sort_order", "updated_at"
) VALUES
    (gen_random_uuid()::text, 'boost_7d', '7-day boost', 'Boost listing visibility for 7 days', 'listing_boost', 'published', 1.99, 'EUR', 7, NULL, NULL, 'PAID_7D', NULL, 10, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'boost_30d', '30-day boost', 'Boost listing visibility for 30 days', 'listing_boost', 'published', 4.99, 'EUR', 30, NULL, NULL, 'PAID_30D', NULL, 20, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'featured_homepage', 'Homepage featured', 'Featured placement on the homepage', 'featured_slot', 'published', 2.99, 'EUR', NULL, 24, 'homepage', NULL, 8, 10, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'featured_category', 'Category featured', 'Featured placement in category browse', 'featured_slot', 'published', 1.99, 'EUR', NULL, 24, 'category', NULL, 4, 20, CURRENT_TIMESTAMP);
