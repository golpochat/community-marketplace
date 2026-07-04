-- Platform governance (super-admin settings) — durable source of truth in PostgreSQL
ALTER TABLE "platform_settings"
ADD COLUMN "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "platform_name" TEXT,
ADD COLUMN "platform_name_override_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "support_email" TEXT,
ADD COLUMN "support_email_override_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "default_currency" VARCHAR(3),
ADD COLUMN "default_currency_override_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "push_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "security_mfa_required" BOOLEAN NOT NULL DEFAULT false;
