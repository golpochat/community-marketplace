'use client';

import { useEffect, useId, useRef, useState } from 'react';

import type { ListingSummary } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';

import { parseListingPayRef } from '@/lib/parse-listing-pay-ref';
import { buyerService } from '@/services/marketplace.service';
import { listingsService } from '@/services/listings.service';

export interface PayListingPickerSelection {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl?: string;
}

interface PayListingPickerProps {
  selectedId: string;
  onSelect: (listing: PayListingPickerSelection | null) => void;
  disabled?: boolean;
}

const FAVORITES_LIMIT = 8;
const SEARCH_LIMIT = 8;
const SEARCH_DEBOUNCE_MS = 300;

function toSelection(listing: ListingSummary): PayListingPickerSelection {
  return {
    id: listing.id,
    title: listing.title,
    price: listing.price,
    currency: listing.currency,
    imageUrl: listing.imageUrl,
  };
}

function ListingChip({
  listing,
  selected,
  onPick,
  disabled,
}: {
  listing: PayListingPickerSelection;
  selected: boolean;
  onPick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      aria-pressed={selected}
      className={`flex w-40 shrink-0 flex-col overflow-hidden rounded-lg border text-left transition-colors disabled:opacity-50 ${
        selected
          ? 'border-[hsl(var(--dashboard-accent))] bg-[hsl(var(--dashboard-accent)/0.08)]'
          : 'border-[hsl(var(--dashboard-sidebar-border))] bg-card hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)]'
      }`}
    >
      <div className="aspect-[4/3] w-full bg-[hsl(var(--dashboard-sidebar-active)/0.5)]">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote listing thumbs; picker is dashboard-only
          <img src={listing.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="space-y-0.5 p-2">
        <p className="line-clamp-2 text-xs font-medium text-[hsl(var(--dashboard-main-fg))]">
          {listing.title}
        </p>
        <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          {formatCurrency(listing.price, listing.currency)}
        </p>
      </div>
    </button>
  );
}

export function PayListingPicker({ selectedId, onSelect, disabled }: PayListingPickerProps) {
  const searchInputId = useId();
  const pasteInputId = useId();
  const listboxId = useId();
  const blurTimerRef = useRef<number | null>(null);

  const [favorites, setFavorites] = useState<PayListingPickerSelection[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PayListingPickerSelection[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [pasteValue, setPasteValue] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteLoading, setPasteLoading] = useState(false);

  const [selected, setSelected] = useState<PayListingPickerSelection | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFavoritesLoading(true);
    void buyerService
      .getFavorites(1, FAVORITES_LIMIT)
      .then((response) => {
        if (cancelled) return;
        const options = (response.data ?? [])
          .filter((listing) => listing.status === 'active')
          .map(toSelection);
        setFavorites(options);
      })
      .catch(() => {
        if (!cancelled) setFavorites([]);
      })
      .finally(() => {
        if (!cancelled) setFavoritesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    const timer = window.setTimeout(() => {
      void listingsService
        .search({ q, page: 1, limit: SEARCH_LIMIT })
        .then((response) => {
          if (cancelled) return;
          const options = (response.data ?? [])
            .filter((listing) => listing.status === 'active')
            .map(toSelection);
          setResults(options);
          setSearchOpen(true);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearchLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current);
    };
  }, []);

  function pick(listing: PayListingPickerSelection) {
    setSelected(listing);
    onSelect(listing);
    setSearchOpen(false);
    setQuery('');
    setPasteError(null);
  }

  function clearSelection() {
    setSelected(null);
    onSelect(null);
  }

  async function resolvePaste() {
    setPasteError(null);
    const parsed = parseListingPayRef(pasteValue);
    if (!parsed) {
      setPasteError('Paste a SellNearby listing link, or a listing id.');
      return;
    }

    setPasteLoading(true);
    try {
      let listingId: string | null =
        parsed.kind === 'uuid' ? parsed.id : await listingsService.resolveByCompactId(parsed.compactId);

      if (!listingId) {
        setPasteError('We could not find that listing.');
        return;
      }

      const listing = await listingsService.getById(listingId, { trackView: false });
      if (!listing || listing.status !== 'active') {
        setPasteError('Only live listings can be paid for here.');
        return;
      }

      pick({
        id: listing.id,
        title: listing.title,
        price: listing.price,
        currency: listing.currency,
        imageUrl: listing.images?.[0]?.thumbUrl ?? listing.images?.[0]?.url,
      });
      setPasteValue('');
    } catch {
      setPasteError('We could not open that listing. Check the link and try again.');
    } finally {
      setPasteLoading(false);
    }
  }

  const showResults = searchOpen && query.trim().length >= 2;

  return (
    <div className="space-y-5">
      <div className="relative">
        <label
          htmlFor={searchInputId}
          className="mb-1.5 block text-xs font-medium text-[hsl(var(--dashboard-sidebar-muted))]"
        >
          Search live listings
        </label>
        <input
          id={searchInputId}
          type="search"
          value={query}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={showResults}
          aria-controls={listboxId}
          aria-autocomplete="list"
          placeholder="Type a title or keyword…"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) setSearchOpen(true);
          }}
          onBlur={() => {
            blurTimerRef.current = window.setTimeout(() => setSearchOpen(false), 150);
          }}
          className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-card px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))] focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))] disabled:opacity-50"
        />
        {searchLoading && (
          <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">Searching…</p>
        )}
        {showResults && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-card py-1"
          >
            {results.length === 0 && !searchLoading ? (
              <li className="px-3 py-2 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                No live listings match that search.
              </li>
            ) : (
              results.map((listing) => (
                <li key={listing.id} role="option" aria-selected={selectedId === listing.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)]"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(listing)}
                  >
                    <span className="min-w-0 flex-1 truncate font-medium text-[hsl(var(--dashboard-main-fg))]">
                      {listing.title}
                    </span>
                    <span className="shrink-0 text-[hsl(var(--dashboard-sidebar-muted))]">
                      {formatCurrency(listing.price, listing.currency)}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-[hsl(var(--dashboard-sidebar-muted))]">
          Saved favorites
        </p>
        {favoritesLoading ? (
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading saved items…</p>
        ) : favorites.length === 0 ? (
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            No saved live listings yet. Search above, or save items while browsing.
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {favorites.map((listing) => (
              <ListingChip
                key={listing.id}
                listing={listing}
                selected={selectedId === listing.id}
                disabled={disabled}
                onPick={() => pick(listing)}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor={pasteInputId}
          className="mb-1.5 block text-xs font-medium text-[hsl(var(--dashboard-sidebar-muted))]"
        >
          Or paste a listing link
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={pasteInputId}
            type="url"
            value={pasteValue}
            disabled={disabled || pasteLoading}
            placeholder="https://sellnearby.ie/listings/…"
            onChange={(e) => {
              setPasteValue(e.target.value);
              setPasteError(null);
            }}
            className="min-w-0 flex-1 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-card px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))] focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))] disabled:opacity-50"
          />
          <button
            type="button"
            disabled={disabled || pasteLoading || !pasteValue.trim()}
            onClick={() => void resolvePaste()}
            className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)] disabled:opacity-50"
          >
            {pasteLoading ? 'Checking…' : 'Use link'}
          </button>
        </div>
        {pasteError && <p className="mt-1.5 text-xs text-destructive">{pasteError}</p>}
      </div>

      {selected && selectedId === selected.id && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.25)] px-3 py-2 text-sm">
          <p className="text-[hsl(var(--dashboard-main-fg))]">
            Selected:{' '}
            <span className="font-medium">{selected.title}</span>
            {' · '}
            {formatCurrency(selected.price, selected.currency)}
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={clearSelection}
            className="text-xs font-medium text-[hsl(var(--dashboard-accent))] hover:underline disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
