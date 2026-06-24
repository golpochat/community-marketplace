export type ChatMessageType = 'text' | 'image' | 'system';

export type ChatTypingEvent = 'buyer_typing' | 'seller_typing';

export type ChatPresenceStatus = 'online' | 'offline';

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  messageType: ChatMessageType;
  attachmentUrl?: string;
  readBy: string[];
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  lastMessageAt?: string;
  archivedByBuyer: boolean;
  archivedBySeller: boolean;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated Use ChatThread */
export type Conversation = ChatThread & {
  participantIds?: string[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
};

export interface ChatParticipantPreview {
  id: string;
  displayName?: string;
  avatarUrl?: string;
  role: string;
  verificationBadge: boolean;
  presence?: ChatPresenceStatus;
}

export interface ChatListingPreview {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl?: string;
  status: string;
}

export interface ChatInboxItem {
  thread: ChatThread;
  lastMessage?: ChatMessage;
  unreadCount: number;
  listing: ChatListingPreview;
  participant: ChatParticipantPreview;
}

export interface ChatAttachmentUploadResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresInSeconds: number;
}

export interface ChatMessageFlag {
  id: string;
  messageId: string;
  reporterId?: string;
  reason: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  moderationNotes?: string;
  resolvedById?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatBan {
  id: string;
  userId: string;
  bannedById?: string;
  reason?: string;
  moderationNotes?: string;
  expiresAt?: string;
  createdAt: string;
}

/** WebSocket event payloads */
export interface WsChatMessageEvent {
  message: ChatMessage;
  threadId: string;
}

export interface WsTypingEvent {
  threadId: string;
  userId: string;
  event: ChatTypingEvent;
}

export interface WsReadReceiptEvent {
  threadId: string;
  readerId: string;
  messageIds: string[];
}

export interface WsPresenceEvent {
  userId: string;
  status: ChatPresenceStatus;
}
