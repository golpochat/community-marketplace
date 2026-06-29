import { redirect } from 'next/navigation';

import { BUYER_ROUTES } from '@/lib/buyer-routes';

export default function Page() {
  redirect(BUYER_ROUTES.profile);
}
