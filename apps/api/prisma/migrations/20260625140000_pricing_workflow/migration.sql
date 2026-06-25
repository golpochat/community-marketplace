-- Pricing workflow: sale prices, discounts, change logs

CREATE TYPE "PriceChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "original_price" DECIMAL(12,2);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "sale_price" DECIMAL(12,2);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "discount_percent" INTEGER;

CREATE TABLE "price_change_logs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "old_original_price" DECIMAL(12,2),
    "old_sale_price" DECIMAL(12,2),
    "new_original_price" DECIMAL(12,2),
    "new_sale_price" DECIMAL(12,2),
    "discount_percent" INTEGER,
    "requires_review" BOOLEAN NOT NULL,
    "status" "PriceChangeStatus" NOT NULL DEFAULT 'PENDING',
    "review_notes" TEXT,
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "price_change_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_change_logs_status_created_at_idx" ON "price_change_logs"("status", "created_at" DESC);
CREATE INDEX "price_change_logs_listing_id_idx" ON "price_change_logs"("listing_id");

ALTER TABLE "price_change_logs" ADD CONSTRAINT "price_change_logs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_change_logs" ADD CONSTRAINT "price_change_logs_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "price_change_logs" ADD CONSTRAINT "price_change_logs_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'price_change_approved';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'price_change_rejected';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'price_review_pending';
