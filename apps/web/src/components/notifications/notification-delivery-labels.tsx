import type { NotificationChannel, NotificationDeliveryStatus } from '@community-marketplace/types';

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  in_app: 'In-app',
  email: 'Email',
  push: 'Push',
};

const STATUS_LABELS: Record<NotificationDeliveryStatus, string> = {
  sent: 'Delivered',
  failed: 'Failed',
  pending: 'Pending',
};

const STATUS_CLASS: Record<NotificationDeliveryStatus, string> = {
  sent: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  failed: 'bg-red-50 text-red-700 ring-red-600/20',
  pending: 'bg-amber-50 text-amber-800 ring-amber-600/20',
};

export function formatNotificationChannelLabel(channel?: NotificationChannel): string {
  if (!channel) return 'Unknown';
  return CHANNEL_LABELS[channel] ?? channel;
}

export function NotificationDeliveryStatusBadge({ status }: { status: NotificationDeliveryStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function formatNotificationTypeLabel(type?: string): string {
  if (!type) return '';
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
