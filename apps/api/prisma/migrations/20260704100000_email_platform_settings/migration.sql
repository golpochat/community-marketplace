-- Email provider routing (policy in DB; API keys stay in env)
ALTER TABLE "platform_settings"
ADD COLUMN "email_provider" TEXT NOT NULL DEFAULT 'brevo',
ADD COLUMN "email_fallback_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "email_from_address" TEXT,
ADD COLUMN "email_from_name" TEXT;
