-- Storefront & account model: Store entity, listing storeId, approval-based counters, store slot SKUs.

-- Platform purchase types for extra storefront slots
ALTER TYPE "PlatformPurchaseType" ADD VALUE IF NOT EXISTS 'store_slot_2';
ALTER TYPE "PlatformPurchaseType" ADD VALUE IF NOT EXISTS 'store_slot_3';
ALTER TYPE "PlatformPurchaseType" ADD VALUE IF NOT EXISTS 'store_bundle_3';

-- Account-level storefront limits and approval-based listing count
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "approved_listing_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "store_slot_limit" INTEGER NOT NULL DEFAULT 1;

-- Stores table
CREATE TABLE IF NOT EXISTS "stores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "banner_url" TEXT,
    "location" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "stores_slug_key" ON "stores"("slug");
CREATE INDEX IF NOT EXISTS "stores_user_id_idx" ON "stores"("user_id");

ALTER TABLE "stores" ADD CONSTRAINT "stores_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Listings: add store_id (nullable during backfill)
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "store_id" TEXT;

-- Backfill one primary store per seller from profile / display name
INSERT INTO "stores" (
    "id",
    "user_id",
    "name",
    "slug",
    "description",
    "logo_url",
    "banner_url",
    "location",
    "is_primary",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid()::text,
    u."id",
    COALESCE(
        NULLIF(TRIM(p."business_name"), ''),
        NULLIF(TRIM(u."display_name"), ''),
        SPLIT_PART(u."email", '@', 1),
        'seller'
    ),
    LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                COALESCE(
                    NULLIF(TRIM(p."business_name"), ''),
                    NULLIF(TRIM(u."display_name"), ''),
                    SPLIT_PART(u."email", '@', 1),
                    'seller'
                ),
                '[^a-zA-Z0-9]+',
                '-',
                'g'
            ),
            '(^-+|-+$)',
            '',
            'g'
        )
    ) || '-' || SUBSTRING(u."id" FROM 1 FOR 8),
    NULLIF(TRIM(p."bio"), ''),
    p."business_logo_url",
    p."store_banner_url",
    p."location",
    true,
    u."created_at",
    NOW()
FROM "users" u
INNER JOIN "roles" r ON r."id" = u."primary_role_id"
LEFT JOIN "user_profiles" p ON p."user_id" = u."id"
WHERE r."code" = 'SELLER'
  AND NOT EXISTS (SELECT 1 FROM "stores" s WHERE s."user_id" = u."id");

-- Attach listings to the seller's primary store
UPDATE "listings" l
SET "store_id" = s."id"
FROM "stores" s
WHERE s."user_id" = l."seller_id"
  AND s."is_primary" = true
  AND l."store_id" IS NULL;

-- Backfill approved listing count (listings that have been activated)
UPDATE "users" u
SET "approved_listing_count" = sub.cnt
FROM (
    SELECT l."seller_id" AS user_id, COUNT(*)::int AS cnt
    FROM "listings" l
    WHERE l."activated_at" IS NOT NULL
    GROUP BY l."seller_id"
) sub
WHERE u."id" = sub.user_id;

-- Enforce NOT NULL on store_id
ALTER TABLE "listings" ALTER COLUMN "store_id" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "listings_store_id_idx" ON "listings"("store_id");

ALTER TABLE "listings" ADD CONSTRAINT "listings_store_id_fkey"
    FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
