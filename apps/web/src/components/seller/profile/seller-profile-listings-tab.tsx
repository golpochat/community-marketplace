'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { Listing } from '@community-marketplace/types';
import { ListingStatusBadge, TruncatedText } from '@community-marketplace/ui-dashboard';

import { ListingPriceDisplay } from '@/components/listings/listing-price-display';
import { SellerVerificationModal } from '@/components/seller/seller-verification-modal';
import { listingImageVariantUrl } from '@/lib/listing-image-url';
import { useSellerListingGate } from '@/hooks/use-seller-listing-gate';
import { chatService } from '@/services/chat.service';
import { sellerService } from '@/services/marketplace.service';

function ListingThumb({ listing }: { listing: Listing }) {
  const cover = listing.images[0];
  const src = cover ? listingImageVariantUrl(cover.url, 'tiny') : undefined;

  if (!src) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100 text-[10px] text-gray-400">
        —
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="aspect-square h-12 w-12 rounded-md object-cover" />
  );
}

export function SellerProfileListingsTab() {
  const router = useRouter();
  const { blocked, tooltip, suspended, blockMessage } = useSellerListingGate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showGateModal, setShowGateModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listingsResult, inbox] = await Promise.all([
        sellerService.getListings(1, 100),
        chatService.getInbox(1, 100).catch(() => null),
      ]);
      setListings(listingsResult.data);

      const counts: Record<string, number> = {};
      const items = Array.isArray(inbox?.data) ? inbox.data : [];
      for (const item of items) {
        const listingId = item.thread?.listingId;
        if (listingId) {
          counts[listingId] = (counts[listingId] ?? 0) + 1;
        }
      }
      setMessageCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedListings = useMemo(
    () => [...listings].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    [listings],
  );

  async function handleDelete(listingId: string) {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    setActionId(listingId);
    setError(null);
    try {
      await sellerService.deleteListing(listingId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setActionId(null);
    }
  }

  async function handleMarkSold(listingId: string) {
    setActionId(listingId);
    setError(null);
    try {
      await sellerService.markListingSold(listingId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionId(null);
    }
  }

  function handleCreateClick() {
    if (blocked) {
      setShowGateModal(true);
      return;
    }
    router.push('/seller/listings/create');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          {loading ? 'Loading…' : `${sortedListings.length} listing${sortedListings.length === 1 ? '' : 's'}`}
        </p>
        <span title={blocked ? tooltip : undefined} className="inline-block">
          <button
            type="button"
            onClick={handleCreateClick}
            disabled={blocked}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              blocked
                ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                : 'bg-[hsl(var(--dashboard-accent))] text-white hover:opacity-90'
            }`}
          >
            Create New Listing
          </button>
        </span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading listings…</p>
      ) : sortedListings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500">
          <p>No listings yet.</p>
          {!blocked && (
            <button
              type="button"
              onClick={handleCreateClick}
              className="mt-3 font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
            >
              Create your first listing
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-700">
                <th className="px-3 py-2 font-medium">Photo</th>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Views</th>
                <th className="px-3 py-2 font-medium">Messages</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {sortedListings.map((listing) => (
                <tr key={listing.id}>
                  <td className="px-3 py-2">
                    <ListingThumb listing={listing} />
                  </td>
                  <td className="max-w-xs px-3 py-2 font-medium text-gray-900">
                    <TruncatedText text={listing.title} />
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    <ListingPriceDisplay
                      price={listing.price}
                      originalPrice={listing.originalPrice}
                      salePrice={listing.salePrice}
                      discountPercent={listing.discountPercent}
                      currency={listing.currency}
                      size="sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <ListingStatusBadge status={listing.status} />
                  </td>
                  <td className="px-3 py-2 text-gray-700">{listing.viewCount}</td>
                  <td className="px-3 py-2 text-gray-700">
                    {messageCounts[listing.id] ?? 0}
                  </td>
                  <td className="px-3 py-2">
                    {suspended ? (
                      <p className="text-xs text-red-600" title={blockMessage}>
                        Unavailable
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/seller/listings/${listing.id}/edit`}
                          className="text-xs font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
                        >
                          Edit
                        </Link>
                        {listing.status === 'active' && (
                          <button
                            type="button"
                            disabled={actionId === listing.id}
                            onClick={() => void handleMarkSold(listing.id)}
                            className="text-xs font-medium text-gray-700 hover:underline disabled:opacity-50"
                          >
                            Mark as Sold
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={actionId === listing.id}
                          onClick={() => void handleDelete(listing.id)}
                          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SellerVerificationModal
        open={showGateModal}
        onClose={() => setShowGateModal(false)}
        message={tooltip}
        dismissible={false}
      />
    </div>
  );
}
