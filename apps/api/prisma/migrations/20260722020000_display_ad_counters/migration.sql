-- AlterTable
ALTER TABLE "display_ad_campaigns" ADD COLUMN "impression_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "display_ad_campaigns" ADD COLUMN "click_count" INTEGER NOT NULL DEFAULT 0;
