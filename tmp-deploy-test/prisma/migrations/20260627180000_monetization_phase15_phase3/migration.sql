-- Phase 1.5: featured listing slots + Phase 3: fast-track verification

ALTER TYPE "PlatformPurchaseType" ADD VALUE IF NOT EXISTS 'featured_slot';
ALTER TYPE "PlatformPurchaseType" ADD VALUE IF NOT EXISTS 'fast_track_verification';

ALTER TABLE "listings"
  ADD COLUMN IF NOT EXISTS "featured_until" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "featured_placement" TEXT;

ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "featured_enabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "seller_verification_requests"
  ADD COLUMN IF NOT EXISTS "priority" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "listings_featured_active_idx"
  ON "listings"("featured_placement", "featured_until")
  WHERE "is_featured" = true;

UPDATE "platform_settings"
SET "pricing" = jsonb_set(
  COALESCE("pricing", '{}'::jsonb),
  '{featured}',
  COALESCE("pricing"->'featured', '{}'::jsonb) || '{"category_slots_per_day": 4}'::jsonb,
  true
)
WHERE "id" = 'default';
