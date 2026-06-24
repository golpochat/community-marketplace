'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ListingSummary } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { searchService } from '@/services/search.service';

export default function SellerSearchPage() {
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
      <PageHeader
        title="Search Marketplace"
        description="Find listings, categories, and sellers across the marketplace."
      />

      <DashboardCard>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch(query);
          }}
          className="mb-4"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search listings, categories, sellers..."
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))]"
          />
        </form>

        {suggestions.length > 0 && (
          <ul className="mb-4 rounded-lg border border-gray-200 bg-white text-sm">
            {suggestions.map((label) => (
              <li key={label}>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50"
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

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {loading && <p className="text-sm text-gray-700">Searching...</p>}

        <ul className="space-y-2">
          {results.map((listing) => (
            <li
              key={listing.id}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <p className="font-medium text-gray-900">{listing.title}</p>
              <p className="text-gray-700">{formatCurrency(listing.price, listing.currency)}</p>
            </li>
          ))}
        </ul>
      </DashboardCard>
    </>
  );
}
