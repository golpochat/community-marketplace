import type { SellerRegistrationKind } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';

export const sellerOnboardingService = {
  getStatus() {
    return apiClient<{ started: boolean; startedAt: string | null; sellerStatus: string }>(
      WEB_API_ROUTES.seller.onboardingStatus,
    );
  },

  start(sellerKind: SellerRegistrationKind) {
    return apiClient(WEB_API_ROUTES.seller.onboardingStart, {
      method: 'POST',
      body: JSON.stringify({ sellerKind }),
    });
  },
};
