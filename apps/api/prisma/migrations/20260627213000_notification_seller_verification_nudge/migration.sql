-- Allow seller verification nudge notifications (force-reverify, listing gate nudges)
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'seller_verification_nudge';
