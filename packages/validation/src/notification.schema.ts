import { z } from 'zod';

import { isoDateSchema, paginationSchema, uuidSchema } from './common.schema';

export const notificationTypeSchema = z.enum([
  'listing_sold',
  'listing_created',
  'new_message',
  'message_read',
  'thread_created',
  'payment_received',
  'payment_sent',
  'payment_refunded',
  'listing_approved',
  'listing_changes_requested',
  'listing_review_reply',
  'delivery_change_approved',
  'delivery_change_rejected',
  'delivery_review_pending',
  'price_change_approved',
  'price_change_rejected',
  'price_review_pending',
  'title_change_approved',
  'title_change_rejected',
  'title_review_pending',
  'verification_approved',
  'verification_rejected',
  'admin_warning',
  'system',
]);

export const notificationChannelSchema = z.enum(['email', 'push', 'in_app']);

export const notificationDeliveryStatusSchema = z.enum(['pending', 'sent', 'failed']);

export const notificationProviderTypeSchema = z.enum(['email', 'push']);

export const notificationSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  type: notificationTypeSchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  data: z.record(z.unknown()).optional(),
  channel: notificationChannelSchema,
  status: notificationDeliveryStatusSchema,
  read: z.boolean(),
  readAt: isoDateSchema.optional(),
  actionUrl: z.string().url().optional(),
  createdAt: isoDateSchema,
});

export const createNotificationSchema = z.object({
  userId: uuidSchema,
  type: notificationTypeSchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  data: z.record(z.unknown()).optional(),
  channel: notificationChannelSchema.default('in_app'),
  actionUrl: z.string().url().optional(),
});

export const notificationTemplateSchema = z.object({
  key: z.string().min(2).max(100),
  titleTemplate: z.string().min(1).max(500),
  bodyTemplate: z.string().min(1).max(5000),
  channel: notificationChannelSchema,
  variables: z.array(z.string().min(1).max(50)).optional(),
});

export const notificationProviderSchema = z.object({
  name: z.string().min(2).max(100),
  type: notificationProviderTypeSchema,
  config: z.record(z.unknown()),
  enabled: z.boolean().optional().default(true),
});

export const notificationPreferencesUpdateSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  inApp: z.boolean().optional(),
  sms: z.boolean().optional(),
  marketing: z.boolean().optional(),
  listingUpdates: z.boolean().optional(),
  messageAlerts: z.boolean().optional(),
  events: z.record(notificationTypeSchema, z.boolean()).optional(),
});

export const broadcastNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: notificationTypeSchema.optional().default('system'),
  role: z.enum(['BUYER', 'SELLER', 'ADMIN']).optional(),
  userIds: z.array(uuidSchema).optional(),
  channels: z.array(notificationChannelSchema).optional(),
});

export const templatePreviewSchema = z.object({
  key: z.string().min(2).max(100),
  channel: notificationChannelSchema,
  variables: z.record(z.string()).optional().default({}),
  version: z.number().int().positive().optional(),
});

export const notificationListQuerySchema = paginationSchema.extend({
  unreadOnly: z.coerce.boolean().optional(),
});

export type NotificationInput = z.infer<typeof notificationSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type NotificationTemplateInput = z.infer<typeof notificationTemplateSchema>;
export type NotificationProviderInput = z.infer<typeof notificationProviderSchema>;
export type NotificationPreferencesUpdateInput = z.infer<typeof notificationPreferencesUpdateSchema>;
export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;
export type TemplatePreviewInput = z.infer<typeof templatePreviewSchema>;
