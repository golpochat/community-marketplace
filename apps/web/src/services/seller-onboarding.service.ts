import type { SellerRegistrationKind } from '@community-marketplace/types';

import type { SellerOnboardingSnapshot } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';

export const sellerOnboardingService = {
  async getStatus(): Promise<SellerOnboardingSnapshot> {
    const response = await apiClient<SellerOnboardingSnapshot>(WEB_API_ROUTES.seller.onboardingStatus);
    return response.data;
  },

  start(sellerKind: SellerRegistrationKind) {
    return apiClient(WEB_API_ROUTES.seller.onboardingStart, {
      method: 'POST',
      body: JSON.stringify({ sellerKind }),
    });
  },
};
