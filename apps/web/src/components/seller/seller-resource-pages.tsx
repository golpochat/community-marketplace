'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { Listing, UserVerification } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { Card } from '@community-marketplace/ui-dashboard';

import { DashboardPageShell, DataTable } from '@/components/dashboard/async-resource';
import { ListingForm, type ListingFormData } from '@/components/seller/listing-form';
import { sellerService } from '@/services/marketplace.service';
import { listingsService } from '@/services/listings.service';

function buildListingPayload(data: ListingFormData, categories: Array<{ id: string; name: string }>) {  const categoryId = data.categoryId || categories[0]?.id;
  if (!categoryId) {
    throw new Error('No categories available. Try again after the API is running.');
  }
  return {
    title: data.title.trim(),
    description: data.description.trim(),
    price: Number(data.price),
    currency: 'EUR',
    categoryId,
    condition: data.condition,
    location: {
      label: data.location.trim() || 'Ireland',
      latitude: 53.3498,
      longitude: -6.2603,
    },
    status: 'active' as const,
  };
}

export function SellerListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await sellerService.getListings();
      setListings(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(listingId: string, action: 'sold' | 'archive' | 'delete') {
    setActionId(listingId);
    setError(null);
    try {
      if (action === 'sold') await sellerService.markListingSold(listingId);
      if (action === 'archive') await sellerService.archiveListing(listingId);
      if (action === 'delete') await sellerService.deleteListing(listingId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionId(null);
    }
  }

  return (
    <DashboardPageShell
      title="My Listings"
      description="Manage your active and draft listings."
      loading={loading}
      error={error}
      empty={!loading && !error && listings.length === 0}
      emptyTitle="No listings yet"
      emptyDescription="Create your first listing to start selling."
    >
      <Card>
        <div className="mb-4 flex justify-end">
          <Link
            href="/seller/listings/create"
            className="inline-flex rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Create listing
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-gray-700">
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Views</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map((listing) => (
                <tr key={listing.id}>
                  <td className="px-3 py-2 font-medium text-gray-900">{listing.title}</td>
                  <td className="px-3 py-2 text-gray-700">
                    {formatCurrency(listing.price, listing.currency)}
                  </td>
                  <td className="px-3 py-2 capitalize text-gray-700">{listing.status}</td>
                  <td className="px-3 py-2 text-gray-700">{listing.viewCount}</td>
                  <td className="px-3 py-2">
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
                          onClick={() => void runAction(listing.id, 'sold')}
                          className="text-xs font-medium text-gray-700 hover:text-gray-900"
                        >
                          Mark sold
                        </button>
                      )}
                      {listing.status !== 'archived' && listing.status !== 'sold' && (
                        <button
                          type="button"
                          disabled={actionId === listing.id}
                          onClick={() => void runAction(listing.id, 'archive')}
                          className="text-xs font-medium text-gray-700 hover:text-gray-900"
                        >
                          Archive
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={actionId === listing.id}
                        onClick={() => void runAction(listing.id, 'delete')}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardPageShell>
  );
}

export function SellerSalesPage() {
  const [rows, setRows] = useState<Array<Array<React.ReactNode>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void sellerService
      .getSoldListings()
      .then((result) => {
        if (cancelled) return;
        setRows(
          result.data.map((listing) => [
            listing.title,
            formatCurrency(listing.price, listing.currency),
            new Date(listing.updatedAt).toLocaleDateString(),
          ]),
        );
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardPageShell
      title="Sales"
      description="Track completed sales."
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      emptyTitle="No sales yet"
    >
      <Card>
        <DataTable columns={['Title', 'Price', 'Sold']} rows={rows} />
      </Card>
    </DashboardPageShell>
  );
}

export function SellerVerificationPage() {
  const [verification, setVerification] = useState<UserVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<{
    idDocumentFront?: File;
    idDocumentBack?: File;
    selfie?: File;
    addressProof?: File;
  }>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await sellerService.getVerification();
      setVerification(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verification');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function handleFileChange(field: keyof typeof files, file: File | undefined) {
    setFiles((current) => ({ ...current, [field]: file }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!files.idDocumentFront || !files.idDocumentBack || !files.selfie || !files.addressProof) {
      setError('Please upload all required documents.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const [idDocumentFrontUrl, idDocumentBackUrl, selfieUrl, addressProofUrl] = await Promise.all([
        sellerService.uploadVerificationDocument(files.idDocumentFront),
        sellerService.uploadVerificationDocument(files.idDocumentBack),
        sellerService.uploadVerificationDocument(files.selfie),
        sellerService.uploadVerificationDocument(files.addressProof),
      ]);

      await sellerService.submitVerification({
        idDocumentFrontUrl,
        idDocumentBackUrl,
        selfieUrl,
        addressProofUrl,
      });
      setFiles({});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !verification || verification.status === 'rejected';

  return (
    <DashboardPageShell
      title="Verification"
      description="Complete identity verification to earn a trusted seller badge."
      loading={loading}
      error={error}
      empty={false}
    >
      <Card title="Verification status">
        {verification ? (
          <dl className="mb-6 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Status</dt>
              <dd className="font-medium capitalize">{verification.status}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Submitted</dt>
              <dd>{new Date(verification.createdAt).toLocaleString()}</dd>
            </div>
            {verification.rejectionReason && (
              <div className="flex justify-between gap-4">
                <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Rejection reason</dt>
                <dd className="text-right text-red-700">{verification.rejectionReason}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="mb-6 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Upload your identity documents to begin verification.
          </p>
        )}

        {canSubmit && (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {(
              [
                ['idDocumentFront', 'ID document (front)'],
                ['idDocumentBack', 'ID document (back)'],
                ['selfie', 'Selfie photo'],
                ['addressProof', 'Proof of address'],
              ] as const
            ).map(([field, label]) => (
              <div key={field}>
                <label className="mb-1 block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
                  {label}
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(event) =>
                    handleFileChange(field, event.target.files?.[0])
                  }
                  className="block w-full text-sm text-[hsl(var(--dashboard-main-fg))]"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Uploading…' : 'Submit verification'}
            </button>
          </form>
        )}
      </Card>
    </DashboardPageShell>
  );
}

export function SellerCreateListingPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void listingsService.getCategories().then((cats) => {
      setCategories(cats.map((c) => ({ id: c.id, name: c.name })));
    });
  }, []);

  async function handleSubmit(data: ListingFormData) {
    setSubmitting(true);
    setError(null);
    try {
      const payload = buildListingPayload(data, categories);
      const response = await sellerService.createListing(payload);
      const listingId = response.data?.id;
      if (listingId && data.images.length > 0) {
        await sellerService.uploadListingImages(listingId, data.images);
      }
      router.push('/seller/listings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardPageShell title="Create Listing" description="Add a new item to your store.">
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {submitting && <p className="mb-4 text-sm text-gray-700">Publishing listing…</p>}
      <Card>
        <ListingForm categories={categories} onSubmit={(data) => void handleSubmit(data)} />
      </Card>
    </DashboardPageShell>
  );
}

export function SellerEditListingPage({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [initialData, setInitialData] = useState<Partial<ListingFormData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [cats, listing] = await Promise.all([
          listingsService.getCategories(),
          listingsService.getById(listingId),
        ]);
        setCategories(cats.map((c) => ({ id: c.id, name: c.name })));
        if (!listing) {
          setError('Listing not found.');
          return;
        }
        setInitialData({
          title: listing.title,
          description: listing.description,
          price: String(listing.price),
          condition: listing.condition,
          categoryId: listing.categoryId,
          location: listing.location.label,
          images: [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [listingId]);

  async function handleSubmit(data: ListingFormData) {
    setSubmitting(true);
    setError(null);
    try {
      const payload = buildListingPayload(data, categories);
      await sellerService.updateListing(listingId, payload);
      if (data.images.length > 0) {
        await sellerService.uploadListingImages(listingId, data.images);
      }
      router.push('/seller/listings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardPageShell title="Edit Listing" description="Update your listing details." loading={loading} error={error}>
      {submitting && <p className="mb-4 text-sm text-gray-700">Saving changes…</p>}
      {initialData && (
        <Card>
          <ListingForm
            categories={categories}
            initialData={initialData}
            submitLabel="Save changes"
            onSubmit={(data) => void handleSubmit(data)}
          />
        </Card>
      )}
    </DashboardPageShell>
  );
}
