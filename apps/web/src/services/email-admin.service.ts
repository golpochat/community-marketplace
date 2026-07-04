import type {
  EmailPlatformSettings,
  EmailSendOutcome,
  EmailSystemStatus,
} from '@community-marketplace/types';
import type { EmailPlatformSettingsUpdateInput } from '@community-marketplace/validation';

import { apiClient } from '@/lib/api-client';
import { adminApiPath } from '@/lib/admin-api-routes';

export const emailAdminService = {
  async getStatus(): Promise<EmailSystemStatus> {
    const response = await apiClient<EmailSystemStatus>(adminApiPath('SUPER_ADMIN', '/email/status'));
    return response.data!;
  },

  async updateSettings(input: EmailPlatformSettingsUpdateInput): Promise<EmailPlatformSettings> {
    const response = await apiClient<EmailPlatformSettings>(
      adminApiPath('SUPER_ADMIN', '/email/settings'),
      { method: 'PATCH', body: JSON.stringify(input) },
    );
    return response.data!;
  },

  async sendTest(to: string): Promise<EmailSendOutcome> {
    const response = await apiClient<EmailSendOutcome>(adminApiPath('SUPER_ADMIN', '/email/test'), {
      method: 'POST',
      body: JSON.stringify({ to }),
    });
    return response.data!;
  },
};
