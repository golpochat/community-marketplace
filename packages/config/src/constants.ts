export const APP_NAME = 'SellNearby.ie';
export const APP_SHORT_NAME = 'SellNearby';
export const APP_BRAND_ABBR = 'SN';

export const RBAC_ROLES = ['SUPER_ADMIN', 'ADMIN', 'SELLER', 'BUYER'] as const;
export const USER_ROLES = RBAC_ROLES;
export const USER_STATUSES = ['active', 'inactive', 'suspended'] as const;

export const LISTING_STATUSES = [
  'draft',
  'pending_review',
  'active',
  'paused',
  'expired',
  'sold',
  'ended',
  'removed',
  'rejected',
] as const;
export const LISTING_CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'] as const;

export const PAYMENT_STATUSES = ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'disputed'] as const;
export const PAYMENT_METHODS = ['card', 'bank_transfer', 'wallet'] as const;

export const NOTIFICATION_TYPES = [
  'listing_sold',
  'listing_created',
  'new_message',
  'message_read',
  'thread_created',
  'payment_received',
  'payment_sent',
  'payment_refunded',
  'listing_approved',
  'listing_rejected',
  'listing_expiring_soon',
  'listing_expired',
  'listing_removed',
  'listing_renewed',
  'listing_changes_requested',
  'listing_review_reply',
  'verification_approved',
  'verification_rejected',
  'admin_warning',
  'system',
] as const;

export const NOTIFICATION_CHANNELS = ['email', 'push', 'in_app'] as const;

export const CHAT_MESSAGE_TYPES = ['text', 'image', 'system'] as const;
export const CHAT_MESSAGE_STATUSES = ['sent', 'delivered', 'read'] as const;

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const DEFAULT_CURRENCY = 'EUR';
export const SUPPORTED_CURRENCIES = ['EUR', 'GBP', 'USD', 'CAD', 'AUD'] as const;

export const API_PREFIX = '/api';

export const PORTS = {
  web: 3000,
  api: 4000,
} as const;

export const DEFAULT_API_URL = `http://localhost:${PORTS.api}${API_PREFIX}`;
