-- CreateEnum
CREATE TYPE "ModerationReportStatus" AS ENUM ('pending', 'reviewed', 'action_taken');

-- CreateEnum
CREATE TYPE "ModerationReportReason" AS ENUM ('fraud', 'harassment', 'spam', 'inappropriate_content', 'scams', 'fake_listing');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('warn', 'suspend', 'ban', 'delete_listing', 'delete_message');

-- CreateEnum
CREATE TYPE "SuspensionDuration" AS ENUM ('hours_24', 'days_7', 'days_30', 'permanent');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "moderation_hidden_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "moderation_reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "target_user_id" TEXT,
    "listing_id" TEXT,
    "message_id" TEXT,
    "reason" "ModerationReportReason" NOT NULL,
    "description" TEXT,
    "status" "ModerationReportStatus" NOT NULL DEFAULT 'pending',
    "admin_id" TEXT,
    "auto_flagged" BOOLEAN NOT NULL DEFAULT false,
    "auto_hidden" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moderation_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "user_id" TEXT,
    "listing_id" TEXT,
    "message_id" TEXT,
    "report_id" TEXT,
    "action_type" "ModerationActionType" NOT NULL,
    "suspension_duration" "SuspensionDuration",
    "notes" TEXT,
    "expires_at" TIMESTAMP(3),
    "lifted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_appeals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "report_id" TEXT,
    "moderation_action_id" TEXT,
    "message" TEXT NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'pending',
    "admin_id" TEXT,
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moderation_appeals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_audit_logs" (
    "id" TEXT NOT NULL,
    "event_type" VARCHAR(60) NOT NULL,
    "actor_id" TEXT,
    "report_id" TEXT,
    "user_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "moderation_reports_status_created_at_idx" ON "moderation_reports"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "moderation_reports_listing_id_idx" ON "moderation_reports"("listing_id");

-- CreateIndex
CREATE INDEX "moderation_reports_target_user_id_idx" ON "moderation_reports"("target_user_id");

-- CreateIndex
CREATE INDEX "moderation_reports_message_id_idx" ON "moderation_reports"("message_id");

-- CreateIndex
CREATE INDEX "moderation_reports_reporter_id_idx" ON "moderation_reports"("reporter_id");

-- CreateIndex
CREATE INDEX "moderation_actions_user_id_created_at_idx" ON "moderation_actions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "moderation_actions_report_id_idx" ON "moderation_actions"("report_id");

-- CreateIndex
CREATE INDEX "moderation_actions_expires_at_lifted_at_idx" ON "moderation_actions"("expires_at", "lifted_at");

-- CreateIndex
CREATE INDEX "moderation_appeals_status_created_at_idx" ON "moderation_appeals"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "moderation_appeals_user_id_idx" ON "moderation_appeals"("user_id");

-- CreateIndex
CREATE INDEX "moderation_audit_logs_report_id_created_at_idx" ON "moderation_audit_logs"("report_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "moderation_audit_logs_user_id_created_at_idx" ON "moderation_audit_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "moderation_audit_logs_event_type_created_at_idx" ON "moderation_audit_logs"("event_type", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "moderation_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "moderation_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_moderation_action_id_fkey" FOREIGN KEY ("moderation_action_id") REFERENCES "moderation_actions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_audit_logs" ADD CONSTRAINT "moderation_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
