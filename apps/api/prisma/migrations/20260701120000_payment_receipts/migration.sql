-- Payment receipts / sales records (buyer + seller PDF-ready HTML documents)
ALTER TABLE "payments"
  ADD COLUMN "receipt_number" TEXT,
  ADD COLUMN "buyer_receipt_key" TEXT,
  ADD COLUMN "seller_receipt_key" TEXT,
  ADD COLUMN "receipt_generated_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "payments_receipt_number_key" ON "payments"("receipt_number");
