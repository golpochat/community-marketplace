import { z } from 'zod';

import { isoDateSchema, paginationSchema, uuidSchema } from './common.schema';

export const chatMessageTypeSchema = z.enum(['text', 'image', 'system']);

export const chatTypingEventSchema = z.enum(['buyer_typing', 'seller_typing']);

export const chatMessageSchema = z.object({
  id: uuidSchema,
  threadId: uuidSchema,
  senderId: uuidSchema,
  content: z.string().min(1).max(4000),
  messageType: chatMessageTypeSchema,
  attachmentUrl: z.string().url().optional(),
  readBy: z.array(uuidSchema),
  editedAt: isoDateSchema.optional(),
  deletedAt: isoDateSchema.optional(),
  createdAt: isoDateSchema,
});

export const chatThreadSchema = z.object({
  id: uuidSchema,
  buyerId: uuidSchema,
  sellerId: uuidSchema,
  listingId: uuidSchema,
  lastMessageAt: isoDateSchema.optional(),
  archivedByBuyer: z.boolean(),
  archivedBySeller: z.boolean(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const createChatThreadSchema = z.object({
  listingId: uuidSchema,
  sellerId: uuidSchema,
});

export const sendChatMessageSchema = z.object({
  threadId: uuidSchema,
  content: z.string().min(1).max(4000),
  messageType: chatMessageTypeSchema.default('text'),
  attachmentUrl: z.string().url().optional(),
});

export const editChatMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

export const markMessagesReadSchema = z.object({
  threadId: uuidSchema,
  messageIds: z.array(uuidSchema).min(1).max(100).optional(),
});

export const chatTypingSchema = z.object({
  threadId: uuidSchema,
  event: chatTypingEventSchema,
});

export const chatMessagesQuerySchema = paginationSchema.extend({
  threadId: uuidSchema,
  before: isoDateSchema.optional(),
});

export const chatInboxQuerySchema = paginationSchema.extend({
  includeArchived: z.coerce.boolean().optional().default(false),
});

export const chatAttachmentUploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  fileName: z.string().max(200).optional(),
  fileSizeBytes: z.number().int().min(1).max(5 * 1024 * 1024),
});

export const flagChatMessageSchema = z.object({
  reason: z.string().min(3).max(200),
  moderationNotes: z.string().max(2000).optional(),
});

export const chatBanUserSchema = z.object({
  userId: uuidSchema,
  reason: z.string().min(3).max(200).optional(),
  moderationNotes: z.string().max(2000).optional(),
  expiresAt: isoDateSchema.optional(),
});

export const chatModerationSearchSchema = z.object({
  q: z.string().min(1).max(200),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

/** @deprecated Use sendChatMessageSchema */
export const sendMessageSchema = sendChatMessageSchema;

/** @deprecated Use chatThreadSchema */
export const conversationSchema = chatThreadSchema.extend({
  participantIds: z.array(uuidSchema).optional(),
  unreadCount: z.number().int().optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type ChatThreadInput = z.infer<typeof chatThreadSchema>;
export type CreateChatThreadInput = z.infer<typeof createChatThreadSchema>;
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
export type ChatInboxQueryInput = z.infer<typeof chatInboxQuerySchema>;
