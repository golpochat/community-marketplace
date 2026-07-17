-- Title amend workflow for previously approved listings (A1: live title stays until admin approves)

CREATE TYPE "TitleChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "title_change_logs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "old_title" TEXT NOT NULL,
    "new_title" TEXT NOT NULL,
    "similarity_score" DOUBLE PRECISION NOT NULL,
    "requires_review" BOOLEAN NOT NULL,
    "status" "TitleChangeStatus" NOT NULL DEFAULT 'PENDING',
    "review_notes" TEXT,
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "title_change_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "title_change_logs_status_created_at_idx" ON "title_change_logs"("status", "created_at" DESC);
CREATE INDEX "title_change_logs_listing_id_idx" ON "title_change_logs"("listing_id");

ALTER TABLE "title_change_logs" ADD CONSTRAINT "title_change_logs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "title_change_logs" ADD CONSTRAINT "title_change_logs_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "title_change_logs" ADD CONSTRAINT "title_change_logs_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'title_change_approved';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'title_change_rejected';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'title_review_pending';
