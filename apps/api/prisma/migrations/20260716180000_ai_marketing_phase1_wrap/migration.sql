-- AI Marketing Hub Phase 1 wrap-up: WhatsApp, email, seasonal promo

ALTER TYPE "AiMarketingTask" ADD VALUE IF NOT EXISTS 'whatsapp_message';
ALTER TYPE "AiMarketingTask" ADD VALUE IF NOT EXISTS 'email_campaign';
ALTER TYPE "AiMarketingTask" ADD VALUE IF NOT EXISTS 'seasonal_promo';
