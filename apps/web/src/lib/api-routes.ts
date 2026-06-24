import { API_NAMESPACES } from './rbac-routes';

export const WEB_API_ROUTES = {
  seller: {
    listings: `${API_NAMESPACES.SELLER}/listings`,
    listingImages: (id: string) => `${API_NAMESPACES.SELLER}/listings/${id}/images`,
    payments: `${API_NAMESPACES.SELLER}/payments`,
    connectOnboard: `${API_NAMESPACES.SELLER}/payments/connect/onboard`,
    connectAccount: `${API_NAMESPACES.SELLER}/payments/connect/account`,
    profile: `${API_NAMESPACES.SELLER}/profile`,
  },
  buyer: {
    purchases: `${API_NAMESPACES.BUYER}/purchases`,
    reviews: `${API_NAMESPACES.BUYER}/reviews`,
    profile: `${API_NAMESPACES.BUYER}/profile`,
    reports: `${API_NAMESPACES.BUYER}/reports`,
  },
  public: {
    listings: '/listings',
    search: '/search',
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      registerComplete: '/auth/register/complete',
      refresh: '/auth/refresh',
      logout: '/auth/logout',
      otpSend: '/auth/otp/send',
      otpVerify: '/auth/otp/verify',
      activate: '/auth/activate',
      activateResend: '/auth/activate/resend',
    },
  },
} as const;
