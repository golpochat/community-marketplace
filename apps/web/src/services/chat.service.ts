import type {
  ChatInboxItem,
  ChatMessage,
  ChatThread,
} from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';

export const chatService = {
  async getInbox(page = 1, limit = 20) {
    const response = await apiClient<ChatInboxItem[]>(WEB_API_ROUTES.chat.inbox, {
      params: { page: String(page), limit: String(limit) },
    });
    return response;
  },

  async getThread(threadId: string) {
    const response = await apiClient<ChatThread>(
      `${WEB_API_ROUTES.chat.threads}/${threadId}`,
    );
    return response.data;
  },

  async getThreadByListing(listingId: string) {
    const response = await apiClient<ChatThread | null>(
      `${WEB_API_ROUTES.chat.threads}/listing/${listingId}`,
    );
    return response.data;
  },

  async createThread(listingId: string, sellerId: string) {
    const response = await apiClient<ChatThread>(WEB_API_ROUTES.chat.threads, {
      method: 'POST',
      body: JSON.stringify({ listingId, sellerId }),
    });
    return response.data;
  },

  async getMessages(threadId: string, page = 1, limit = 50) {
    const response = await apiClient<ChatMessage[]>(
      `${WEB_API_ROUTES.chat.threads}/${threadId}/messages`,
      { params: { page: String(page), limit: String(limit) } },
    );
    return response;
  },

  async sendMessage(threadId: string, content: string, messageType: 'text' | 'image' = 'text', attachmentUrl?: string) {
    const response = await apiClient<ChatMessage>(WEB_API_ROUTES.chat.messages, {
      method: 'POST',
      body: JSON.stringify({
        threadId,
        content,
        messageType,
        ...(attachmentUrl ? { attachmentUrl } : {}),
      }),
    });
    return response.data;
  },

  async markRead(threadId: string, messageIds?: string[]) {
    await apiClient(WEB_API_ROUTES.chat.markRead, {
      method: 'POST',
      body: JSON.stringify({ threadId, messageIds }),
    });
  },
};
