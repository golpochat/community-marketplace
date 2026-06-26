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
      className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2 hover:bg-gray-100"
    >
      {preview.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview.imageUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded object-cover"
        />
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-900">{preview.title}</p>
        <p className="text-xs text-gray-600">{formatCurrency(preview.price, preview.currency)}</p>
      </div>
    </Link>
  );
}
