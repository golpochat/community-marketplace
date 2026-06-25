export type NotificationType =
  | 'listing_sold'
  | 'listing_created'
  | 'new_message'
  | 'message_read'
  | 'thread_created'
  | 'payment_received'
  | 'payment_sent'
  | 'payment_refunded'
  | 'listing_approved'
  | 'listing_rejected'
  | 'listing_expiring_soon'
  | 'listing_expired'
  | 'listing_removed'
  | 'listing_renewed'
  | 'listing_changes_requested'
  | 'listing_review_reply'
  | 'delivery_change_approved'
  | 'delivery_change_rejected'
  | 'delivery_review_pending'
  | 'price_change_approved'
  | 'price_change_rejected'
  | 'price_review_pending'
  | 'verification_approved'
  | 'verification_rejected'
  | 'admin_warning'
  | 'system';

export type NotificationChannel = 'email' | 'push' | 'in_app';

export type NotificationDeliveryStatus = 'pending' | 'sent' | 'failed';

export type NotificationProviderType = 'email' | 'push';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  /** @deprecated Use message */
  body?: string;
  data?: Record<string, unknown>;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  read: boolean;
  readAt?: string;
  actionUrl?: string;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  key: string;
  titleTemplate: string;
  bodyTemplate: string;
  channel: NotificationChannel;
  variables?: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationProvider {
  id: string;
  name: string;
  type: NotificationProviderType;
  config: Record<string, unknown>;
  enabled: boolean;
  failureCount: number;
  disabledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  notificationId?: string;
  providerId: string;
  status: NotificationDeliveryStatus;
  response?: Record<string, unknown>;
  attempts: number;
  createdAt: string;
}

export interface DispatchNotificationInput {
  userId: string;
  type: NotificationType;
  templateKey: string;
  variables?: Record<string, string>;
  actionUrl?: string;
  data?: Record<string, unknown>;
  channels?: NotificationChannel[];
}

export interface BroadcastNotificationInput {
  title: string;
  message: string;
  type?: NotificationType;
  role?: 'BUYER' | 'SELLER' | 'ADMIN';
  userIds?: string[];
  channels?: NotificationChannel[];
}
