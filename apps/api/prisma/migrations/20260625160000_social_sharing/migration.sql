-- Social sharing: short links and share analytics

CREATE TYPE "SharePlatform" AS ENUM (
  'WHATSAPP',
  'FACEBOOK',
  'INSTAGRAM',
  'MESSENGER',
  'X',
  'TELEGRAM',
  'EMAIL',
  'COPY_LINK',
  'QR',
  'NATIVE'
);

CREATE TABLE "short_links" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "short_code" TEXT NOT NULL,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "short_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "short_links_short_code_key" ON "short_links"("short_code");
CREATE INDEX "short_links_listing_id_idx" ON "short_links"("listing_id");

CREATE TABLE "listing_shares" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "platform" "SharePlatform" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_shares_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "listing_shares_listing_id_created_at_idx" ON "listing_shares"("listing_id", "created_at" DESC);
CREATE INDEX "listing_shares_seller_id_created_at_idx" ON "listing_shares"("seller_id", "created_at" DESC);
CREATE INDEX "listing_shares_platform_idx" ON "listing_shares"("platform");

ALTER TABLE "short_links" ADD CONSTRAINT "short_links_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_shares" ADD CONSTRAINT "listing_shares_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_shares" ADD CONSTRAINT "listing_shares_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
