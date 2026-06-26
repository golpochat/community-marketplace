import type { AdminMessageFlagItem } from '@community-marketplace/types';
import type { PaginatedResult } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { adminApiPath } from '@/lib/admin-api-routes';
import { normalizePaginated } from '@/lib/normalize-api-response';

export type AdminServiceRole = 'ADMIN' | 'SUPER_ADMIN';

export const adminChatModerationService = {
  async listMessageFlags(
    role: AdminServiceRole,
    params: { page?: number; limit?: number; status?: string } = {},
  ): Promise<PaginatedResult<AdminMessageFlagItem>> {
    const response = await apiClient<AdminMessageFlagItem[] | PaginatedResult<AdminMessageFlagItem>>(
      adminApiPath(role, '/chat/flags'),
      {
        params: {
          page: String(params.page ?? 1),
          limit: String(params.limit ?? 20),
          ...(params.status ? { status: params.status } : {}),
        },
      },
    );
    return normalizePaginated(response, { page: params.page ?? 1, limit: params.limit ?? 20 });
  },

  async getThread(role: AdminServiceRole, threadId: string) {
    const response = await apiClient<{
      id: string;
      messages: Array<{ id: string; content: string; createdAt: string; senderId: string }>;
    }>(`${adminApiPath(role, '/chat/threads')}/${threadId}`);
    return response.data;
  },

  async resolveFlag(
    role: AdminServiceRole,
    flagId: string,
    body: { status: 'resolved' | 'dismissed'; moderationNotes?: string },
  ) {
    const response = await apiClient(
      `${adminApiPath(role, '/chat/flags')}/${flagId}/resolve`,
      { method: 'POST', body: JSON.stringify(body) },
    );
    return response.data;
  },

  async suspendSeller(role: AdminServiceRole, sellerId: string, reason: string) {
    const response = await apiClient(adminApiPath(role, '/seller/suspend'), {
      method: 'POST',
      body: JSON.stringify({ userId: sellerId, reason }),
    });
    return response.data;
  },
};
