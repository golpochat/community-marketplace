import { z } from 'zod';

import { isoDateSchema, uuidSchema } from './common.schema';

export const chatMessageTypeSchema = z.enum(['text', 'image', 'system']);

export const chatMessageStatusSchema = z.enum(['sent', 'delivered', 'read']);

export const chatMessageSchema = z.object({
  id: uuidSchema,
  conversationId: uuidSchema,
  senderId: uuidSchema,
  recipientId: uuidSchema,
  listingId: uuidSchema.optional(),
  type: chatMessageTypeSchema,
  content: z.string().min(1).max(4000),
  status: chatMessageStatusSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const conversationSchema = z.object({
  id: uuidSchema,
  participantIds: z.array(uuidSchema).min(2).max(10),
  listingId: uuidSchema.optional(),
  lastMessage: chatMessageSchema.optional(),
  unreadCount: z.number().int().min(0),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const sendMessageSchema = z.object({
  conversationId: uuidSchema,
  recipientId: uuidSchema,
  listingId: uuidSchema.optional(),
  type: chatMessageTypeSchema.default('text'),
  content: z.string().min(1).max(4000),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type ConversationInput = z.infer<typeof conversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
