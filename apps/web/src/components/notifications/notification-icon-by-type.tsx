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
  verification_approved: '🛡️',
  verification_rejected: '⚠️',
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
