-- CreateEnum
CREATE TYPE "UserGender" AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "profile_completed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN "address" TEXT,
ADD COLUMN "latitude" DECIMAL(10,7),
ADD COLUMN "longitude" DECIMAL(10,7),
ADD COLUMN "date_of_birth" DATE,
ADD COLUMN "gender" "UserGender",
ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "user_verifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "id_document_front_url" TEXT,
    "id_document_back_url" TEXT,
    "selfie_url" TEXT,
    "address_proof_url" TEXT,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "badge_granted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "notification_preferences" JSONB NOT NULL DEFAULT '{}',
    "privacy_settings" JSONB NOT NULL DEFAULT '{}',
    "communication_preferences" JSONB NOT NULL DEFAULT '{}',
    "deletion_requested_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_bans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "BanType" NOT NULL,
    "reason" TEXT,
    "banned_by_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "lifted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_bans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_audit_logs" (
    "id" TEXT NOT NULL,
    "event_type" VARCHAR(60) NOT NULL,
    "actor_id" TEXT,
    "target_user_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE INDEX "user_verifications_user_id_status_idx" ON "user_verifications"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_verifications_status_created_at_idx" ON "user_verifications"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_bans_user_id_lifted_at_idx" ON "user_bans"("user_id", "lifted_at");

-- CreateIndex
CREATE INDEX "user_audit_logs_target_user_id_created_at_idx" ON "user_audit_logs"("target_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_audit_logs_event_type_created_at_idx" ON "user_audit_logs"("event_type", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "user_verifications" ADD CONSTRAINT "user_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_verifications" ADD CONSTRAINT "user_verifications_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bans" ADD CONSTRAINT "user_bans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bans" ADD CONSTRAINT "user_bans_banned_by_id_fkey" FOREIGN KEY ("banned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_audit_logs" ADD CONSTRAINT "user_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_audit_logs" ADD CONSTRAINT "user_audit_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
