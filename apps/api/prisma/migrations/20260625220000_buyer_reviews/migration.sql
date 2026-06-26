CREATE TABLE IF NOT EXISTS "buyer_reviews" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "payment_id" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "buyer_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "buyer_reviews_seller_id_listing_id_key" ON "buyer_reviews"("seller_id", "listing_id");
CREATE INDEX IF NOT EXISTS "buyer_reviews_buyer_id_idx" ON "buyer_reviews"("buyer_id");

ALTER TABLE "buyer_reviews" ADD CONSTRAINT "buyer_reviews_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "buyer_reviews" ADD CONSTRAINT "buyer_reviews_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "buyer_reviews" ADD CONSTRAINT "buyer_reviews_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
