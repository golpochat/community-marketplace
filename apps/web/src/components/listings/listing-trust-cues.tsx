import Link from 'next/link';

import { ListingBadge } from '@/components/listings/listing-badge';
import { MessageSquare, ShieldCheck } from 'lucide-react';

export function ListingTrustCues({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        Buyer protection
      </p>
      <p className="mb-3 text-sm text-gray-600">
        We verify sellers to keep your community safe.
      </p>
      <div className="flex flex-wrap gap-2">
        <ListingBadge tone="outline" className="font-normal">
          <ShieldCheck className="h-3 w-3" aria-hidden />
          Verified community marketplace
        </ListingBadge>
        <ListingBadge tone="outline" className="font-normal">
          <MessageSquare className="h-3 w-3" aria-hidden />
          Secure messaging
        </ListingBadge>
        <ListingBadge tone="outline" className="font-normal">
          Report suspicious listings instantly
        </ListingBadge>
      </div>
      <Link href="/safety" className="mt-2 inline-block text-xs text-primary hover:underline">
        Read safety tips →
      </Link>
    </div>
  );
}
