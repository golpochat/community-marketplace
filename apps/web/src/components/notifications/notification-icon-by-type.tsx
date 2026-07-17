import type { NotificationType } from '@community-marketplace/types';

const ICONS: Record<NotificationType, string> = {
  listing_sold: '💰',
  listing_created: '📦',
  new_message: '💬',
  message_read: '✓',
  thread_created: '💬',
  payment_received: '💳',
  payment_sent: '💳',
  payment_refunded: '↩️',
  listing_approved: '✅',
  listing_rejected: '❌',
  listing_expiring_soon: '⏰',
  listing_expired: '⌛',
  listing_removed: '🚫',
  listing_renewed: '🔄',
  listing_changes_requested: '📝',
  listing_review_reply: '💬',
  delivery_change_approved: '✅',
  delivery_change_rejected: '❌',
  delivery_review_pending: '⏳',
  price_change_approved: '✅',
  price_change_rejected: '❌',
  price_review_pending: '⏳',
  title_change_approved: '✅',
  title_change_rejected: '❌',
  title_review_pending: '⏳',
  verification_approved: '🛡️',
  verification_rejected: '⚠️',
  seller_verification_nudge: '🛡️',
  admin_warning: '⚠️',
  system: '🔔',
};

interface NotificationIconByTypeProps {
  type: NotificationType;
  className?: string;
}

export function NotificationIconByType({ type, className }: NotificationIconByTypeProps) {
  return (
    <span className={className} aria-hidden>
      {ICONS[type] ?? '🔔'}
    </span>
  );
}
