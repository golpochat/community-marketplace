-- AlterEnum NotificationType
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'message_read';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'thread_created';

-- CreateTable chat_threads
CREATE TABLE "chat_threads" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "last_message_at" TIMESTAMP(3),
    "archived_by_buyer" BOOLEAN NOT NULL DEFAULT false,
    "archived_by_seller" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chat_threads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chat_threads_buyer_id_seller_id_listing_id_key" ON "chat_threads"("buyer_id", "seller_id", "listing_id");
CREATE INDEX "chat_threads_buyer_id_last_message_at_idx" ON "chat_threads"("buyer_id", "last_message_at" DESC);
CREATE INDEX "chat_threads_seller_id_last_message_at_idx" ON "chat_threads"("seller_id", "last_message_at" DESC);
CREATE INDEX "chat_threads_listing_id_idx" ON "chat_threads"("listing_id");

ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable chat_messages
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "message_type" "ChatMessageType" NOT NULL DEFAULT 'text',
    "attachment_url" TEXT,
    "read_by" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "edited_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "chat_messages_thread_id_created_at_idx" ON "chat_messages"("thread_id", "created_at" DESC);

ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable chat_message_flags
CREATE TABLE "chat_message_flags" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "reporter_id" TEXT,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "moderation_notes" TEXT,
    "resolved_by_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chat_message_flags_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "chat_message_flags_status_created_at_idx" ON "chat_message_flags"("status", "created_at" DESC);
CREATE INDEX "chat_message_flags_message_id_idx" ON "chat_message_flags"("message_id");

ALTER TABLE "chat_message_flags" ADD CONSTRAINT "chat_message_flags_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_message_flags" ADD CONSTRAINT "chat_message_flags_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chat_message_flags" ADD CONSTRAINT "chat_message_flags_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable chat_bans
CREATE TABLE "chat_bans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "banned_by_id" TEXT,
    "reason" TEXT,
    "moderation_notes" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_bans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "chat_bans_user_id_expires_at_idx" ON "chat_bans"("user_id", "expires_at");

ALTER TABLE "chat_bans" ADD CONSTRAINT "chat_bans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_bans" ADD CONSTRAINT "chat_bans_banned_by_id_fkey" FOREIGN KEY ("banned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
