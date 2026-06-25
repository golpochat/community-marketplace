import { revalidatePath, revalidateTag } from 'next/cache';

import { listingCacheTag } from '@/lib/server-listings';

function listingShareCacheTag(listingId: string): string {
  return `listing-share-${listingId}`;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const secret = request.headers.get('x-revalidate-secret');
  const expected = process.env.REVALIDATE_SECRET;

  if (!expected || secret !== expected) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  revalidateTag(listingCacheTag(id));
  revalidateTag(listingShareCacheTag(id));
  revalidatePath(`/listings/${id}`);

  return Response.json({ revalidated: true, listingId: id });
}
