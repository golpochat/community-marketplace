-- Listing lifecycle: expanded status enum, package types, expiry fields, status change log

CREATE TYPE "ListingPackageType" AS ENUM (
  'FREE',
  'PAID_7D',
  'PAID_30D',
  'PAID_60D',
  'PAID_90D',
  'PREMIUM_UNTIL_SOLD'
);

CREATE TYPE "ListingStatusActorType" AS ENUM ('SELLER', 'ADMIN', 'SYSTEM');

CREATE TYPE "ListingStatus_new" AS ENUM (
  'draft',
  'pending_review',
  'active',
  'paused',
  'expired',
  'sold',
  'ended',
  'removed',
  'rejected'
);

ALTER TABLE "listings" ADD COLUMN "is_paid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "listings" ADD COLUMN "package_type" "ListingPackageType" NOT NULL DEFAULT 'FREE';
ALTER TABLE "listings" ADD COLUMN "activated_at" TIMESTAMP(3);
ALTER TABLE "listings" ADD COLUMN "expires_at" TIMESTAMP(3);
ALTER TABLE "listings" ADD COLUMN "ended_at" TIMESTAMP(3);
ALTER TABLE "listings" ADD COLUMN "rejection_reason" TEXT;
ALTER TABLE "listings" ADD COLUMN "removal_reason" TEXT;

ALTER TABLE "listings" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "listings" ALTER COLUMN "status" TYPE "ListingStatus_new" USING (
  CASE "status"::text
    WHEN 'archived' THEN 'ended'::"ListingStatus_new"
    WHEN 'banned' THEN 'removed'::"ListingStatus_new"
    ELSE "status"::text::"ListingStatus_new"
  END
);

ALTER TABLE "listing_audit_logs" ALTER COLUMN "from_status" TYPE "ListingStatus_new" USING (
  CASE
    WHEN "from_status" IS NULL THEN NULL
    WHEN "from_status"::text = 'archived' THEN 'ended'::"ListingStatus_new"
    WHEN "from_status"::text = 'banned' THEN 'removed'::"ListingStatus_new"
    ELSE "from_status"::text::"ListingStatus_new"
  END
);

ALTER TABLE "listing_audit_logs" ALTER COLUMN "to_status" TYPE "ListingStatus_new" USING (
  CASE
    WHEN "to_status" IS NULL THEN NULL
    WHEN "to_status"::text = 'archived' THEN 'ended'::"ListingStatus_new"
    WHEN "to_status"::text = 'banned' THEN 'removed'::"ListingStatus_new"
    ELSE "to_status"::text::"ListingStatus_new"
  END
);

DROP TYPE "ListingStatus";
ALTER TYPE "ListingStatus_new" RENAME TO "ListingStatus";
ALTER TABLE "listings" ALTER COLUMN "status" SET DEFAULT 'draft';

-- Backfill expiry for existing live listings
UPDATE "listings"
SET
  "activated_at" = COALESCE("activated_at", "created_at"),
  "expires_at" = COALESCE("expires_at", "created_at" + INTERVAL '30 days')
WHERE "status" IN ('active', 'paused');

CREATE TABLE "listing_status_change_logs" (
  "id" TEXT NOT NULL,
  "listing_id" TEXT NOT NULL,
  "from_status" "ListingStatus",
  "to_status" "ListingStatus" NOT NULL,
  "changed_by_type" "ListingStatusActorType" NOT NULL,
  "changed_by_id" TEXT,
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "listing_status_change_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "listing_status_change_logs_listing_id_created_at_idx"
  ON "listing_status_change_logs"("listing_id", "created_at" DESC);

ALTER TABLE "listing_status_change_logs"
  ADD CONSTRAINT "listing_status_change_logs_listing_id_fkey"
  FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "listings_status_expires_at_idx" ON "listings"("status", "expires_at");

-- Notification types
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'listing_rejected';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'listing_expiring_soon';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'listing_expired';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'listing_removed';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'listing_renewed';
