-- Community trust & monetisation foundations
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "community_area" TEXT;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "referral_code" TEXT;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "referral_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "referred_by_id" TEXT;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "is_community_ambassador" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "is_business_account" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "business_name" TEXT;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "business_website" TEXT;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "business_logo_url" TEXT;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "onboarding_dismissed_at" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_referral_code_key" ON "user_profiles"("referral_code");

ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "boosted_until" TIMESTAMP(3);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "requires_fraud_review" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "seller_reviews" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seller_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "seller_reviews_buyer_id_listing_id_key" ON "seller_reviews"("buyer_id", "listing_id");
CREATE INDEX IF NOT EXISTS "seller_reviews_seller_id_idx" ON "seller_reviews"("seller_id");

ALTER TABLE "seller_reviews" ADD CONSTRAINT "seller_reviews_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seller_reviews" ADD CONSTRAINT "seller_reviews_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seller_reviews" ADD CONSTRAINT "seller_reviews_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
