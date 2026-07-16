-- AI Marketing Hub Phase 1: keywords + social caption tasks

ALTER TYPE "AiMarketingTask" ADD VALUE IF NOT EXISTS 'keywords';
ALTER TYPE "AiMarketingTask" ADD VALUE IF NOT EXISTS 'instagram_caption';
ALTER TYPE "AiMarketingTask" ADD VALUE IF NOT EXISTS 'facebook_ad';
ALTER TYPE "AiMarketingTask" ADD VALUE IF NOT EXISTS 'tiktok_script';
