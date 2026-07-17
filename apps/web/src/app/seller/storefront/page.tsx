import { redirect } from 'next/navigation';

import { SELLER_ROUTES } from '@/lib/seller-routes';

/** Legacy path — storefront lives under the unified account shell. */
export default function Page() {
  redirect(SELLER_ROUTES.storefront);
}
