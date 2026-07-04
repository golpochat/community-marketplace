-- Per-field sender overrides (off by default — env EMAIL_FROM / EMAIL_FROM_NAME are the defaults)
ALTER TABLE "platform_settings"
ADD COLUMN "email_from_address_override_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "email_from_name_override_enabled" BOOLEAN NOT NULL DEFAULT false;

-- Clear redundant copies so env defaults apply until an override is explicitly enabled
UPDATE "platform_settings"
SET
  "email_from_address" = NULL,
  "email_from_name" = NULL,
  "email_from_address_override_enabled" = false,
  "email_from_name_override_enabled" = false
WHERE "id" = 'default';
