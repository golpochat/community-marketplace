import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getWebDashboardPathForRole, WEB_APP_ROUTES } from '@/lib/rbac-routes';
import { getWebRoleFromCookie } from '@/lib/role-cookie';

export default async function LegacyDashboardRedirectPage() {
  const cookieStore = await cookies();
  const role = getWebRoleFromCookie(cookieStore.toString());
  redirect(role ? getWebDashboardPathForRole(role) : WEB_APP_ROUTES.login);
}
