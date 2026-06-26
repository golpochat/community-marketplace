import { apiClient } from '@/lib/api-client';

export const moderationService = {
  async reportUser(payload: {
    targetUserId: string;
    reason: string;
    description?: string;
  }): Promise<void> {
    await apiClient('/moderation/reports/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
