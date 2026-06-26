'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ListingReviewContext } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { Button } from '@community-marketplace/ui';

import { Gallery } from '@/components/listings/gallery';
import { ListingReviewThread } from '@/components/dashboard/listing-review-thread';
import { adminService, type AdminServiceRole } from '@/services/admin.service';
import { useAuth } from '@/hooks/use-auth';

interface AdminListingReviewDialogProps {
  open: boolean;
  listingId: string | null;
  role: AdminServiceRole;
  onClose: () => void;
  onApproved: () => void;
}

function conditionLabel(condition: string): string {
  return condition.replace(/_/g, ' ');
}

export function AdminListingReviewDialog({
  open,
  listingId,
  role,
  onClose,
  onApproved,
}: AdminListingReviewDialogProps) {
  const { user } = useAuth();
  const [review, setReview] = useState<ListingReviewContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [requestingChanges, setRequestingChanges] = useState(false);
  const [changeNote, setChangeNote] = useState('');

  const loadReview = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getListingReview(role, listingId);
      setReview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listing review');
      setReview(null);
    } finally {
      setLoading(false);
    }
  }, [listingId, role]);

  useEffect(() => {
    if (open && listingId) {
      void loadReview();
    } else {
      setReview(null);
      setChangeNote('');
      setError(null);
    }
  }, [open, listingId, loadReview]);

  if (!open || !listingId) return null;

  const listing = review?.listing;
  const canApprove = listing?.status === 'pending_review' || listing?.status === 'draft';

  async function handleApprove() {
    if (!listingId || !canApprove) return;
    setApproving(true);
    try {
      await adminService.approveListing(role, listingId);
      onApproved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve listing');
    } finally {
      setApproving(false);
    }
  }

  async function handleRequestChanges() {
    if (!listingId) return;
    const trimmed = changeNote.trim();
    if (!trimmed) {
      setError('Enter feedback before requesting changes.');
      return;
    }
    setRequestingChanges(true);
    setError(null);
    try {
      const data = await adminService.requestListingChanges(role, listingId, trimmed);
      setReview(data);
      setChangeNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request changes');
    } finally {
      setRequestingChanges(false);
    }
  }

  async function handleSendMessage(content: string) {
    if (!listingId) return;
    const data = await adminService.sendListingReviewMessage(role, listingId, content);
    setReview(data);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-listing-review-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Listing review</p>
              <h2 id="admin-listing-review-title" className="mt-1 text-xl font-semibold text-gray-900">
                {listing?.title ?? 'Loading…'}
              </h2>
            </div>
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading && <p className="text-sm text-gray-600">Loading listing details…</p>}
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          {listing && (
            <div className="space-y-8">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="min-w-0">
                  <Gallery images={listing.images} title={listing.title} />
                </div>
                <div className="space-y-3 text-sm text-gray-700">
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(listing.price, listing.currency)}
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">Category:</span>{' '}
                    {listing.category?.name ?? listing.categoryId}
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">Condition:</span>{' '}
                    {conditionLabel(listing.condition)}
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">Location:</span> {listing.location.label}
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">Status:</span> {listing.status}
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">Seller:</span>{' '}
                    {listing.seller?.displayName?.trim() ||
                      listing.seller?.email ||
                      'Unknown seller'}
                    {listing.seller?.email &&
                    listing.seller.displayName?.trim() &&
                    listing.seller.email !== listing.seller.displayName ? (
                      <span className="text-gray-500"> ({listing.seller.email})</span>
                    ) : null}
                  </p>
                  <div>
                    <p className="font-medium text-gray-900">Description</p>
                    <p className="mt-1 whitespace-pre-wrap">{listing.description}</p>
                  </div>
                  {listing.moderationNotes && (
                    <div className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
                      <p className="text-xs font-semibold uppercase">Latest admin note</p>
                      <p className="mt-1 whitespace-pre-wrap">{listing.moderationNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900">Conversation with seller</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Request changes or continue the thread if the listing needs corrections before approval.
                </p>
                <div className="mt-4">
                  <ListingReviewThread
                    messages={review?.messages ?? []}
                    currentUserId={user?.id}
                    onSend={handleSendMessage}
                    disabled={!canApprove}
                  />
                </div>
              </div>

              {canApprove && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-900">Request changes</p>
                  <p className="mt-1 text-sm text-amber-800">
                    Sends feedback to the seller and keeps the listing as a draft.
                  </p>
                  <textarea
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    rows={3}
                    placeholder="Describe what the seller should fix…"
                    className="mt-3 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2"
                    disabled={requestingChanges || !changeNote.trim()}
                    onClick={() => void handleRequestChanges()}
                  >
                    {requestingChanges ? 'Sending…' : 'Request changes'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {canApprove && listing && (
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" disabled={approving} onClick={() => void handleApprove()}>
              {approving ? 'Approving…' : 'Approve listing'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
