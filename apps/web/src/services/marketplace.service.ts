import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';

export const sellerService = {
  getListings: () => apiClient(WEB_API_ROUTES.seller.listings),
  createListing: (body: unknown) =>
    apiClient(WEB_API_ROUTES.seller.listings, { method: 'POST', body: JSON.stringify(body) }),
  getEarnings: () => apiClient(WEB_API_ROUTES.seller.earnings),
  getProfile: () => apiClient(WEB_API_ROUTES.seller.profile),
};

export const buyerService = {
  getPayments: () => apiClient(WEB_API_ROUTES.buyer.payments),
  createPaymentIntent: (body: unknown) =>
    apiClient(WEB_API_ROUTES.buyer.paymentsIntent, { method: 'POST', body: JSON.stringify(body) }),
  getReviews: () => apiClient(WEB_API_ROUTES.buyer.reviews),
  createReview: (body: unknown) =>
    apiClient(WEB_API_ROUTES.buyer.reviews, { method: 'POST', body: JSON.stringify(body) }),
  getProfile: () => apiClient(WEB_API_ROUTES.buyer.profile),
};
