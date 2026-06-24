export type ChatMessageType = 'text' | 'image' | 'system';

export type ChatMessageStatus = 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  listingId?: string;
  type: ChatMessageType;
  content: string;
  status: ChatMessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  listingId?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}
