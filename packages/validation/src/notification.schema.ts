import { z } from 'zod';

import { isoDateSchema, uuidSchema } from './common.schema';

export const notificationTypeSchema = z.enum([
  'listing_sold',
  'new_message',
  'payment_received',
  'payment_sent',
  'listing_approved',
  'system',
]);

export const notificationSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  type: notificationTypeSchema,
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  read: z.boolean(),
  actionUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: isoDateSchema,
});

export const createNotificationSchema = notificationSchema.omit({
  id: true,
  createdAt: true,
});

export type NotificationInput = z.infer<typeof notificationSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
