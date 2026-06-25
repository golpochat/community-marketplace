import { redirect, notFound } from 'next/navigation';

import { resolveShortLink } from '@/lib/server-share';

interface ShortLinkPageProps {
  params: Promise<{ shortCode: string }>;
}

export default async function ShortLinkRedirectPage({ params }: ShortLinkPageProps) {
  const { shortCode } = await params;
  const listingId = await resolveShortLink(shortCode);
  if (!listingId) notFound();
  redirect(`/listings/${listingId}`);
}
