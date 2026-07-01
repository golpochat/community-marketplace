'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import type { ListingSummary } from '@community-marketplace/types';
import { Input } from '@community-marketplace/ui';
import { formatCurrency } from '@community-marketplace/utils';
import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { searchService } from '@/services/search.service';

export default function BuyerSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ListingSummary[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await searchService.searchListings({ q, limit: '20', page: '1' });
      setResults((response.data as ListingSummary[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      void searchService.autocomplete(query).then((items) => {
        setSuggestions(items.map((s) => s.label).slice(0, 5));
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <>
      <PageHeader title="Search Listings" description="Find items across the marketplace." />

      <DashboardCard>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch(query);
          }}
          className="mb-4"
        >
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search listings..."
            aria-label="Search listings"
          />
        </form>

        {suggestions.length > 0 && (
          <ul className="mb-4 overflow-hidden rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] text-sm">
            {suggestions.map((label) => (
              <li key={label}>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[hsl(var(--dashboard-main-fg))] transition-colors duration-150 hover:bg-[hsl(var(--dashboard-sidebar-active)/0.5)]"
                  onClick={() => {
                    setQuery(label);
                    void runSearch(label);
                  }}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
        {loading && (
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Searching...</p>
        )}

        <ul className="space-y-2">
          {results.map((listing) => (
            <li
              key={listing.id}
              className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] px-3 py-2 text-sm"
            >
              <Link href={`/listings/${listing.id}`} className="block hover:opacity-90">
                <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">{listing.title}</p>
                <p className="text-[hsl(var(--dashboard-sidebar-muted))]">
                  {formatCurrency(listing.price, listing.currency)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </DashboardCard>
    </>
  );
}
