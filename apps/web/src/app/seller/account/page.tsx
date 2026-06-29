import { redirect } from 'next/navigation';

import { SELLER_ROUTES } from '@/lib/seller-routes';

export default function Page() {
  redirect(SELLER_ROUTES.profile);
}
