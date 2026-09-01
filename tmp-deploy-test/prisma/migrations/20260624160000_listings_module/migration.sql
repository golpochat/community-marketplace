-- AlterEnum
ALTER TYPE "ListingStatus" ADD VALUE 'banned';

-- AlterTable categories
ALTER TABLE "categories" ADD COLUMN "icon" TEXT;
ALTER TABLE "categories" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "categories" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Self-relation for category hierarchy
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable listings: location -> location_label + geo + analytics + moderation
ALTER TABLE "listings" RENAME COLUMN "location" TO "location_label";
ALTER TABLE "listings" ADD COLUMN "latitude" DECIMAL(10,7) NOT NULL DEFAULT 0;
ALTER TABLE "listings" ADD COLUMN "longitude" DECIMAL(10,7) NOT NULL DEFAULT 0;
ALTER TABLE "listings" ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "listings" ADD COLUMN "favorite_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "listings" ADD COLUMN "banned_at" TIMESTAMP(3);
ALTER TABLE "listings" ADD COLUMN "banned_by_id" TEXT;
ALTER TABLE "listings" ADD COLUMN "moderation_notes" TEXT;

CREATE INDEX "listings_category_id_idx" ON "listings"("category_id");
CREATE INDEX "listings_latitude_longitude_idx" ON "listings"("latitude", "longitude");

ALTER TABLE "listings" ADD CONSTRAINT "listings_banned_by_id_fkey"
  FOREIGN KEY ("banned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Simplify listing_images (drop optional display columns)
ALTER TABLE "listing_images" DROP COLUMN IF EXISTS "alt_text";
ALTER TABLE "listing_images" DROP COLUMN IF EXISTS "is_primary";
CREATE INDEX "listing_images_listing_id_sort_order_idx" ON "listing_images"("listing_id", "sort_order");

-- CreateTable listing_favorites
CREATE TABLE "listing_favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "listing_favorites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "listing_favorites_user_id_listing_id_key" ON "listing_favorites"("user_id", "listing_id");
CREATE INDEX "listing_favorites_user_id_created_at_idx" ON "listing_favorites"("user_id", "created_at" DESC);

ALTER TABLE "listing_favorites" ADD CONSTRAINT "listing_favorites_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_favorites" ADD CONSTRAINT "listing_favorites_listing_id_fkey"
  FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable listing_reports
CREATE TABLE "listing_reports" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "moderation_notes" TEXT,
    "action_taken" TEXT,
    "resolved_by_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "listing_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "listing_reports_status_created_at_idx" ON "listing_reports"("status", "created_at" DESC);
CREATE INDEX "listing_reports_listing_id_idx" ON "listing_reports"("listing_id");

ALTER TABLE "listing_reports" ADD CONSTRAINT "listing_reports_listing_id_fkey"
  FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_reports" ADD CONSTRAINT "listing_reports_reporter_id_fkey"
  FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "listing_reports" ADD CONSTRAINT "listing_reports_resolved_by_id_fkey"
  FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable listing_audit_logs
CREATE TABLE "listing_audit_logs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "event_type" TEXT NOT NULL,
    "from_status" "ListingStatus",
    "to_status" "ListingStatus",
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "listing_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "listing_audit_logs_listing_id_created_at_idx" ON "listing_audit_logs"("listing_id", "created_at" DESC);

ALTER TABLE "listing_audit_logs" ADD CONSTRAINT "listing_audit_logs_listing_id_fkey"
  FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_audit_logs" ADD CONSTRAINT "listing_audit_logs_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
