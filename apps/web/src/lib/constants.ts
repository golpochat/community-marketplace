import { DEFAULT_API_URL } from '@community-marketplace/config';

import { WEB_APP_ROUTES } from './rbac-routes';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;

export { WEB_APP_ROUTES, API_NAMESPACES, getWebDashboardPathForRole } from './rbac-routes';
export { WEB_API_ROUTES } from './api-routes';

/** @deprecated Use WEB_APP_ROUTES */
export const APP_ROUTES = {
  home: WEB_APP_ROUTES.home,
  listings: WEB_APP_ROUTES.listings,
  chat: WEB_APP_ROUTES.chat,
  dashboard: WEB_APP_ROUTES.buyerDashboard,
  login: WEB_APP_ROUTES.login,
  register: WEB_APP_ROUTES.register,
} as const;
