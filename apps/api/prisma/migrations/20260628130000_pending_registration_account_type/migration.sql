-- Pending registration: account type enum + password hash (matches PostgreSQL enum RegistrationAccountType)

DO $$ BEGIN
  CREATE TYPE "RegistrationAccountType" AS ENUM ('buyer', 'seller');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "pending_registrations" ADD COLUMN IF NOT EXISTS "password_hash" TEXT;

ALTER TABLE "pending_registrations" ADD COLUMN IF NOT EXISTS "account_type" "RegistrationAccountType";

UPDATE "pending_registrations" SET "account_type" = 'buyer' WHERE "account_type" IS NULL;

ALTER TABLE "pending_registrations" ALTER COLUMN "account_type" SET DEFAULT 'buyer';
ALTER TABLE "pending_registrations" ALTER COLUMN "account_type" SET NOT NULL;
