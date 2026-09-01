-- Allow custom role codes (not limited to the four system enum values)
ALTER TABLE "roles" ALTER COLUMN "code" TYPE VARCHAR(64) USING "code"::text;

-- Enum retained for backwards compatibility; column no longer uses it
-- DROP TYPE "RbacRoleCode"; -- optional cleanup; skipped to avoid migration risk
