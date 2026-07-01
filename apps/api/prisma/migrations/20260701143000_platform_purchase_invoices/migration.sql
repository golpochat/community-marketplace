-- Platform purchase invoices (seller monetization payments)
ALTER TABLE "platform_purchases"
  ADD COLUMN "receipt_number" TEXT,
  ADD COLUMN "receipt_key" TEXT,
  ADD COLUMN "receipt_generated_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "platform_purchases_receipt_number_key" ON "platform_purchases"("receipt_number");
