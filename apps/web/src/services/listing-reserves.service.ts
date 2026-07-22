import type { ListingReserve } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';

export const listingReservesService = {
  async request(listingId: string): Promise<ListingReserve> {
    const response = await apiClient<ListingReserve>(WEB_API_ROUTES.buyer.reserves, {
      method: 'POST',
      body: JSON.stringify({ listingId }),
    });
    return response.data;
  },

  async listMine(): Promise<ListingReserve[]> {
    const response = await apiClient<ListingReserve[]>(WEB_API_ROUTES.buyer.reservesMine);
    return response.data;
  },

  async cancelByBuyer(reserveId: string): Promise<ListingReserve> {
    const response = await apiClient<ListingReserve>(
      WEB_API_ROUTES.buyer.reserveCancel(reserveId),
      { method: 'POST' },
    );
    return response.data;
  },

  async listPending(): Promise<ListingReserve[]> {
    const response = await apiClient<ListingReserve[]>(WEB_API_ROUTES.seller.reservesPending);
    return response.data;
  },

  async approve(reserveId: string): Promise<ListingReserve> {
    const response = await apiClient<ListingReserve>(
      WEB_API_ROUTES.seller.reserveApprove(reserveId),
      { method: 'POST' },
    );
    return response.data;
  },

  async decline(reserveId: string): Promise<ListingReserve> {
    const response = await apiClient<ListingReserve>(
      WEB_API_ROUTES.seller.reserveDecline(reserveId),
      { method: 'POST' },
    );
    return response.data;
  },

  async cancelBySeller(reserveId: string): Promise<ListingReserve> {
    const response = await apiClient<ListingReserve>(
      WEB_API_ROUTES.seller.reserveCancel(reserveId),
      { method: 'POST' },
    );
    return response.data;
  },
};
