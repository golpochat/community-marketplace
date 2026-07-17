-- Featured storefront SKU: homepage shop placement

ALTER TYPE "PlatformPurchaseType" ADD VALUE IF NOT EXISTS 'featured_store';

ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "featured_until" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "stores_is_featured_featured_until_idx" ON "stores"("is_featured", "featured_until");
