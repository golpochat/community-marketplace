import { redirect } from 'next/navigation';

import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

export default function LegacySellerDashboardRedirectPage() {
  redirect(WEB_APP_ROUTES.sellerDashboard);
}
