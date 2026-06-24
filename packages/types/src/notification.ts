export type NotificationType =
  | 'listing_sold'
  | 'new_message'
  | 'payment_received'
  | 'payment_sent'
  | 'listing_approved'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
