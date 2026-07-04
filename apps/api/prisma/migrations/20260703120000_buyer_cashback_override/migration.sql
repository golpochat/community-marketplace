-- Per-buyer cashback override on users (replaces flexible cashback rules for admin)

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "custom_cashback_percent" DECIMAL(5,2);
