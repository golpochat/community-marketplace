-- Seller messaging: conversation block state and last-message preview
ALTER TABLE "chat_threads" ADD COLUMN "last_message_preview" TEXT;
ALTER TABLE "chat_threads" ADD COLUMN "is_blocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "chat_threads" ADD COLUMN "blocked_by" TEXT;

ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_blocked_by_fkey"
  FOREIGN KEY ("blocked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
