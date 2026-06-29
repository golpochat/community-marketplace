-- Per-storefront public details: contact, opening hours, seller policies.

ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "contact_settings" JSONB;
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "opening_hours" JSONB;
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "policies" JSONB;
