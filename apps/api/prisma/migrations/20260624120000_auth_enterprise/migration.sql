-- AlterTable
ALTER TABLE "users" ADD COLUMN "phone_verified_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "auth_sessions" ADD COLUMN "device_fingerprint" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_phone_key" ON "user_profiles"("phone");

-- CreateTable
CREATE TABLE "auth_login_audit" (
    "id" TEXT NOT NULL,
    "event_type" VARCHAR(40) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "user_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_fingerprint" TEXT,
    "success" BOOLEAN NOT NULL,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_login_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_login_audit_email_created_at_idx" ON "auth_login_audit"("email", "created_at" DESC);

-- CreateIndex
CREATE INDEX "auth_login_audit_ip_address_created_at_idx" ON "auth_login_audit"("ip_address", "created_at" DESC);

-- CreateIndex
CREATE INDEX "auth_login_audit_phone_created_at_idx" ON "auth_login_audit"("phone", "created_at" DESC);

-- CreateTable
CREATE TABLE "pending_registrations" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_registrations_email_key" ON "pending_registrations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pending_registrations_phone_key" ON "pending_registrations"("phone");

-- CreateIndex
CREATE INDEX "pending_registrations_expires_at_idx" ON "pending_registrations"("expires_at");
