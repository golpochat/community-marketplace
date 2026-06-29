import { redirect } from 'next/navigation';

import { SUPER_ADMIN_PERSONAL_ROUTES } from '@/lib/admin-routes';

export default function Page() {
  redirect(SUPER_ADMIN_PERSONAL_ROUTES.profile);
}
