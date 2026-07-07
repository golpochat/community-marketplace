import Link from 'next/link';

import type { ChatListingPreview } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { BrandMediaImage } from '@community-marketplace/ui';

interface ListingPreviewInChatProps {
  preview: ChatListingPreview;
}

export function ListingPreviewInChat({ preview }: ListingPreviewInChatProps) {
  return (
    <Link
      href={`/listings/${preview.id}`}
      className="flex gap-3 rounded-lg border border-border bg-muted/50 p-2 hover:bg-muted"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded">
        <BrandMediaImage src={preview.imageUrl} alt={preview.title} rounded="sm" className="h-12 w-12" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-foreground">{preview.title}</p>
        <p className="text-xs text-muted-foreground">{formatCurrency(preview.price, preview.currency)}</p>
      </div>
    </Link>
  );
}
