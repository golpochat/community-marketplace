'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import type { ListingSummary } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';

import { searchService } from '@/services/search.service';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Search Listings</h1>
        <Link href={WEB_APP_ROUTES.buyerDashboard} className="text-sm text-blue-600 hover:underline">
          Dashboard
        </Link>
      </div>

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
          placeholder="Search listings..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </form>

      {suggestions.length > 0 && (
        <ul className="mb-4 rounded-md border border-gray-200 bg-white text-sm">
          {suggestions.map((label) => (
            <li key={label}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left hover:bg-gray-50"
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
      {loading && <p className="text-sm text-gray-500">Searching...</p>}

      <ul className="space-y-2">
        {results.map((listing) => (
          <li key={listing.id} className="rounded-md border border-gray-200 px-3 py-2 text-sm">
            <p className="font-medium text-gray-900">{listing.title}</p>
            <p className="text-gray-600">{formatCurrency(listing.price, listing.currency)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
