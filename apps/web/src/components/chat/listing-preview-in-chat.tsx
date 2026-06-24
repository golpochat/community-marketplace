import Link from 'next/link';

import type { ChatListingPreview } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';

interface ListingPreviewInChatProps {
  preview: ChatListingPreview;
}

export function ListingPreviewInChat({ preview }: ListingPreviewInChatProps) {
  return (
    <Link
      href={`/listings/${preview.id}`}
      className="mb-2 block rounded-lg border border-white/20 bg-black/10 p-2 hover:bg-black/20"
    >
      <p className="text-xs font-medium">{preview.title}</p>
      <p className="text-xs opacity-80">{formatCurrency(preview.price, preview.currency)}</p>
    </Link>
  );
}
