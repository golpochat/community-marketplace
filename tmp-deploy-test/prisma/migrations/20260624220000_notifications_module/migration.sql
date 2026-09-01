-- Notification module enterprise expansion

CREATE TYPE "NotificationChannel" AS ENUM ('email', 'push', 'in_app');
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE "NotificationProviderType" AS ENUM ('email', 'push');

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'listing_created';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'payment_refunded';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'verification_approved';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'verification_rejected';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'admin_warning';

ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "data" JSONB;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "channel" "NotificationChannel" NOT NULL DEFAULT 'in_app';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'sent';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMP(3);

UPDATE "notifications" SET "read_at" = NOW() WHERE "read" = true AND "read_at" IS NULL;

ALTER TABLE "notifications" DROP COLUMN IF EXISTS "read";

DROP INDEX IF EXISTS "notifications_user_id_read_created_at_idx";
CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at" DESC);
CREATE INDEX "notifications_user_id_channel_created_at_idx" ON "notifications"("user_id", "channel", "created_at" DESC);

CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title_template" TEXT NOT NULL,
    "body_template" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "variables" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_templates_key_channel_version_key" ON "notification_templates"("key", "channel", "version");
CREATE INDEX "notification_templates_key_channel_idx" ON "notification_templates"("key", "channel");

CREATE TABLE "notification_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "NotificationProviderType" NOT NULL,
    "config" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "disabled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_providers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_providers_name_key" ON "notification_providers"("name");

CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT,
    "provider_id" TEXT NOT NULL,
    "status" "NotificationDeliveryStatus" NOT NULL,
    "response" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notification_logs_notification_id_created_at_idx" ON "notification_logs"("notification_id", "created_at" DESC);
CREATE INDEX "notification_logs_provider_id_created_at_idx" ON "notification_logs"("provider_id", "created_at" DESC);

ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "notification_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "device_tokens" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "device_tokens" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "device_tokens_user_id_token_key" ON "device_tokens"("user_id", "token");
CREATE INDEX IF NOT EXISTS "device_tokens_user_id_is_active_idx" ON "device_tokens"("user_id", "is_active");
