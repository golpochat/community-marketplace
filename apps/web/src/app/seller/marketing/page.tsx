import { redirect } from 'next/navigation';

import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

export default function SellerMarketingRedirectPage() {
  redirect(WEB_APP_ROUTES.accountMarketing);
}
