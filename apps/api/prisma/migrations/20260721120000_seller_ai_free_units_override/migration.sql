-- Per-seller AI Marketing Hub free-units override

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "custom_ai_marketing_free_units_monthly" INTEGER;
