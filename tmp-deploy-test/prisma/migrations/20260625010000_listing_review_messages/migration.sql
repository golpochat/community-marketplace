-- Listing review thread (admin ↔ seller) and notification types

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'listing_changes_requested';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'listing_review_reply';

CREATE TABLE "listing_review_messages" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_review_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "listing_review_messages_listing_id_created_at_idx" ON "listing_review_messages"("listing_id", "created_at");

ALTER TABLE "listing_review_messages" ADD CONSTRAINT "listing_review_messages_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_review_messages" ADD CONSTRAINT "listing_review_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
