-- AI Marketing Hub Phase 2: image enhance, bg remove, banner creator

ALTER TYPE "AiMarketingTask" ADD VALUE IF NOT EXISTS 'image_enhance';
ALTER TYPE "AiMarketingTask" ADD VALUE IF NOT EXISTS 'image_bg_remove';
ALTER TYPE "AiMarketingTask" ADD VALUE IF NOT EXISTS 'banner_creator';
