-- Admin-run brand display ad campaigns (payment offline)

CREATE TYPE "DisplayAdCampaignStatus" AS ENUM ('draft', 'scheduled', 'live', 'paused', 'ended');
CREATE TYPE "DisplayAdPlacementCode" AS ENUM ('homepage_leaderboard', 'category_sidebar', 'search_results_inline');

CREATE TABLE "display_ad_campaigns" (
    "id" TEXT NOT NULL,
    "advertiser_name" VARCHAR(160) NOT NULL,
    "advertiser_email" VARCHAR(255),
    "advertiser_notes" VARCHAR(1000),
    "placement" "DisplayAdPlacementCode" NOT NULL,
    "status" "DisplayAdCampaignStatus" NOT NULL DEFAULT 'draft',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "image_key" VARCHAR(512) NOT NULL,
    "image_url" VARCHAR(1024) NOT NULL,
    "click_url" VARCHAR(2048) NOT NULL,
    "alt_text" VARCHAR(200),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_by_admin_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "display_ad_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "display_ad_campaigns_placement_status_starts_at_ends_at_idx" ON "display_ad_campaigns"("placement", "status", "starts_at", "ends_at");
CREATE INDEX "display_ad_campaigns_status_updated_at_idx" ON "display_ad_campaigns"("status", "updated_at" DESC);

ALTER TABLE "display_ad_campaigns" ADD CONSTRAINT "display_ad_campaigns_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
