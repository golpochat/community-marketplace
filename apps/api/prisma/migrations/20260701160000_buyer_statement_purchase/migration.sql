-- Add buyer_statement platform purchase type for paid statement unlocks
ALTER TYPE "PlatformPurchaseType" ADD VALUE IF NOT EXISTS 'buyer_statement';
