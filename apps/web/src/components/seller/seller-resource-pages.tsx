'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { formatCurrency } from '@community-marketplace/utils';
import { Card } from '@community-marketplace/ui-dashboard';

import { DashboardPageShell, DataTable } from '@/components/dashboard/async-resource';
import { ListingForm } from '@/components/seller/listing-form';
import { sellerService } from '@/services/marketplace.service';
import { listingsService } from '@/services/listings.service';

export function SellerListingsPage() {
  const [rows, setRows] = useState<Array<Array<React.ReactNode>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void sellerService
      .getListings()
      .then((result) => {
        if (cancelled) return;
        setRows(
          result.data.map((listing) => [
            listing.title,
            formatCurrency(listing.price, listing.currency),
            listing.status,
            listing.viewCount,
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
      title="My Listings"
      description="Manage your active and draft listings."
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
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
        <DataTable columns={['Title', 'Price', 'Status', 'Views']} rows={rows} />
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
  const [verification, setVerification] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await sellerService.getVerification();
      setVerification((response.data as Record<string, unknown> | null) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verification');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await sellerService.submitVerification({
        idDocumentFrontUrl: 'https://example.com/id-front.pdf',
        idDocumentBackUrl: 'https://example.com/id-back.pdf',
        selfieUrl: 'https://example.com/selfie.jpg',
        addressProofUrl: 'https://example.com/address.pdf',
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardPageShell
      title="Verification"
      description="Complete identity verification to earn a trusted seller badge."
      loading={loading}
      error={error}
      empty={!loading && !error && !verification}
      emptyTitle="Verification not started"
      emptyDescription="Submit your documents to begin verification."
    >
      <Card title="Verification status">
        {verification ? (
          <pre className="mb-4 overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-900">
            {JSON.stringify(verification, null, 2)}
          </pre>
        ) : (
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit verification (dev)'}
          </button>
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

  async function handleSubmit(data: {
    title: string;
    description: string;
    price: string;
    condition: string;
    categoryId: string;
    location: string;
  }) {
    setSubmitting(true);
    setError(null);
    try {
      const categoryId = data.categoryId || categories[0]?.id;
      if (!categoryId) {
        throw new Error('No categories available. Try again after the API is running.');
      }
      await sellerService.createListing({
        title: data.title,
        description: data.description,
        price: Number(data.price),
        currency: 'EUR',
        categoryId,
        condition: data.condition,
        location: {
          label: data.location || 'Unknown',
          latitude: 0,
          longitude: 0,
        },
        status: 'active',
      });
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
        <ListingForm
          categories={categories}
          onSubmit={(data) => void handleSubmit(data)}
        />
      </Card>
    </DashboardPageShell>
  );
}
