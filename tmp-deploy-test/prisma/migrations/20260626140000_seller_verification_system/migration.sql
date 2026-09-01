-- Seller verification system: user fields, verification requests, status history

CREATE TYPE "SellerStatus" AS ENUM (
  'unverified',
  'verification_required',
  'verified',
  'suspended',
  'under_review'
);

ALTER TYPE "OtpPurpose" ADD VALUE IF NOT EXISTS 'seller_verify';

ALTER TABLE "users"
  ADD COLUMN "seller_status" "SellerStatus" NOT NULL DEFAULT 'unverified',
  ADD COLUMN "unverified_listing_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "phone_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "id_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "verification_requested_at" TIMESTAMP(3),
  ADD COLUMN "verification_completed_at" TIMESTAMP(3),
  ADD COLUMN "verification_rejected_reason" TEXT,
  ADD COLUMN "seller_limit" INTEGER NOT NULL DEFAULT 5;

-- Backfill verification flags from existing timestamp columns
UPDATE "users"
SET
  "email_verified" = ("email_verified_at" IS NOT NULL),
  "phone_verified" = ("phone_verified_at" IS NOT NULL);

-- Mark sellers with approved identity verification as verified
UPDATE "users" u
SET
  "seller_status" = 'verified',
  "id_verified" = true,
  "verification_completed_at" = v."reviewed_at"
FROM "user_verifications" v
WHERE v."user_id" = u."id"
  AND v."status" = 'approved'
  AND v."badge_granted" = true;

CREATE TABLE "seller_verification_requests" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "phone_number" TEXT,
  "id_document_path" TEXT,
  "selfie_path" TEXT,
  "address_document_path" TEXT,
  "status" "VerificationStatus" NOT NULL DEFAULT 'pending',
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "rejection_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "seller_verification_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seller_status_history" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "old_status" "SellerStatus" NOT NULL,
  "new_status" "SellerStatus" NOT NULL,
  "changed_by" TEXT,
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "seller_status_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "seller_verification_requests_user_id_status_idx"
  ON "seller_verification_requests"("user_id", "status");
CREATE INDEX "seller_verification_requests_status_created_at_idx"
  ON "seller_verification_requests"("status", "created_at" DESC);
CREATE INDEX "seller_status_history_user_id_created_at_idx"
  ON "seller_status_history"("user_id", "created_at" DESC);
CREATE INDEX "users_seller_status_idx" ON "users"("seller_status");

ALTER TABLE "seller_verification_requests"
  ADD CONSTRAINT "seller_verification_requests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seller_verification_requests"
  ADD CONSTRAINT "seller_verification_requests_reviewed_by_fkey"
  FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "seller_status_history"
  ADD CONSTRAINT "seller_status_history_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seller_status_history"
  ADD CONSTRAINT "seller_status_history_changed_by_fkey"
  FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
