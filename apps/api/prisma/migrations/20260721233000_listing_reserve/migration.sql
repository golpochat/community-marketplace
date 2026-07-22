-- Listing Reserve Phase 1

DO $$ BEGIN
  ALTER TYPE "ListingStatus" ADD VALUE 'reserved';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TYPE "ListingReserveStatus" AS ENUM (
  'pending_seller',
  'active',
  'converted',
  'declined',
  'cancelled_buyer',
  'cancelled_seller',
  'expired_pending',
  'expired'
);

ALTER TABLE "listings"
ADD COLUMN IF NOT EXISTS "reserve_window_hours" INTEGER NOT NULL DEFAULT 12;

CREATE TABLE IF NOT EXISTS "listing_reserves" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "status" "ListingReserveStatus" NOT NULL DEFAULT 'pending_seller',
    "window_hours" INTEGER,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decision_at" TIMESTAMP(3),
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "pending_expires_at" TIMESTAMP(3) NOT NULL,
    "listing_price_snapshot" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_reserves_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "listing_reserves_listing_id_status_idx" ON "listing_reserves"("listing_id", "status");
CREATE INDEX IF NOT EXISTS "listing_reserves_buyer_id_status_updated_at_idx" ON "listing_reserves"("buyer_id", "status", "updated_at" DESC);
CREATE INDEX IF NOT EXISTS "listing_reserves_seller_id_status_requested_at_idx" ON "listing_reserves"("seller_id", "status", "requested_at" DESC);
CREATE INDEX IF NOT EXISTS "listing_reserves_status_pending_expires_at_idx" ON "listing_reserves"("status", "pending_expires_at");
CREATE INDEX IF NOT EXISTS "listing_reserves_status_expires_at_idx" ON "listing_reserves"("status", "expires_at");

DO $$ BEGIN
  ALTER TABLE "listing_reserves" ADD CONSTRAINT "listing_reserves_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "listing_reserves" ADD CONSTRAINT "listing_reserves_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "listing_reserves" ADD CONSTRAINT "listing_reserves_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
