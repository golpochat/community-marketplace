-- AlterEnum
ALTER TYPE "PlatformPurchaseType" ADD VALUE 'priority_message';

-- AlterTable chat_threads
ALTER TABLE "chat_threads" ADD COLUMN "priority_boost_until" TIMESTAMP(3);

-- AlterTable chat_messages
ALTER TABLE "chat_messages" ADD COLUMN "is_priority" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "chat_messages" ADD COLUMN "priority_until" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "chat_threads_buyer_id_priority_boost_until_idx" ON "chat_threads"("buyer_id", "priority_boost_until" DESC);
CREATE INDEX "chat_threads_seller_id_priority_boost_until_idx" ON "chat_threads"("seller_id", "priority_boost_until" DESC);
