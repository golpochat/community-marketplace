-- Admin/super-admin publish toggle for AI Marketing Hub (sellers).
ALTER TABLE "platform_settings"
ADD COLUMN "ai_marketing_enabled" BOOLEAN NOT NULL DEFAULT false;
