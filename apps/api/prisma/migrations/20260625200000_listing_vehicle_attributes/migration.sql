-- AlterTable
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "attributes" JSONB;
