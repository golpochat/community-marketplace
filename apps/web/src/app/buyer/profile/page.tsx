import { redirect } from 'next/navigation';

import { resolveBuyerProfileRedirect } from '@/lib/buyer-routes';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const params = await searchParams;
  const tab = typeof params.tab === 'string' ? params.tab : undefined;
  redirect(resolveBuyerProfileRedirect(tab));
}
