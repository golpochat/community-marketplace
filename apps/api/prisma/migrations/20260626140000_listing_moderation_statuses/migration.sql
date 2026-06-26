-- Listing moderation statuses
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'flagged';
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'under_investigation';
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'suspended_seller';
