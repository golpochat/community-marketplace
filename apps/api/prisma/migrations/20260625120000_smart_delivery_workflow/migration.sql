-- Smart delivery workflow: catalog options, listing delivery, change logs

CREATE TYPE "DeliveryZone" AS ENUM ('COLLECTION', 'LOCAL', 'NATIONAL', 'CUSTOM');
CREATE TYPE "DeliveryChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "delivery_options" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "zone" "DeliveryZone" NOT NULL,
    "default_price" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "listing_delivery_options" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "delivery_option_id" TEXT NOT NULL,
    "custom_label" TEXT,
    "custom_price" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_delivery_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "delivery_change_logs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "requires_review" BOOLEAN NOT NULL,
    "status" "DeliveryChangeStatus" NOT NULL DEFAULT 'PENDING',
    "review_notes" TEXT,
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "delivery_change_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "listing_delivery_options_listing_id_idx" ON "listing_delivery_options"("listing_id");
CREATE INDEX "delivery_change_logs_status_created_at_idx" ON "delivery_change_logs"("status", "created_at" DESC);
CREATE INDEX "delivery_change_logs_listing_id_idx" ON "delivery_change_logs"("listing_id");

ALTER TABLE "listing_delivery_options" ADD CONSTRAINT "listing_delivery_options_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_delivery_options" ADD CONSTRAINT "listing_delivery_options_delivery_option_id_fkey" FOREIGN KEY ("delivery_option_id") REFERENCES "delivery_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "delivery_change_logs" ADD CONSTRAINT "delivery_change_logs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "delivery_change_logs" ADD CONSTRAINT "delivery_change_logs_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "delivery_change_logs" ADD CONSTRAINT "delivery_change_logs_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'delivery_change_approved';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'delivery_change_rejected';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'delivery_review_pending';

-- Seed default delivery options (stable IDs for dev)
INSERT INTO "delivery_options" ("id", "label", "description", "zone", "default_price", "is_active", "created_at", "updated_at")
VALUES
  ('00000000-0000-4000-8000-000000000200', 'Collection Only', 'Buyer collects the item from the seller location', 'COLLECTION', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000201', 'Dublin Local Delivery', 'Delivery within Dublin area', 'LOCAL', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000202', 'Ireland Nationwide Delivery', 'Delivery anywhere in Ireland', 'NATIONAL', 25, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000203', 'Custom Delivery Fee', 'Seller-defined delivery option with custom label and price', 'CUSTOM', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  zone = EXCLUDED.zone,
  default_price = EXCLUDED.default_price,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;
