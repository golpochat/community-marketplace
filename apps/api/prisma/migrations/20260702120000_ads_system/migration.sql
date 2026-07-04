-- Unified ads system: display advertising publish toggle (unpublished by default).
ALTER TABLE "platform_settings"
ADD COLUMN "display_ads_enabled" BOOLEAN NOT NULL DEFAULT false;
