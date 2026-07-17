import Link from 'next/link';

import type { FeaturedStoreSummary } from '@community-marketplace/types';

interface FeaturedStoresProps {
  stores: FeaturedStoreSummary[];
}

export function FeaturedStores({ stores }: FeaturedStoresProps) {
  const items = Array.isArray(stores) ? stores : [];
  if (items.length === 0) return null;

  return (
    <section className="py-10 md:px-6">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="max-w-xl">
          <h2 className="text-section-title">Featured shops</h2>
          <p className="text-body mt-2">
            Seller-promoted storefronts with premium homepage placement
          </p>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {items.slice(0, 6).map((store) => (
            <li key={store.id}>
              <Link
                href={`/store/${encodeURIComponent(store.slug)}`}
                className="group flex flex-col items-center gap-2 rounded-lg p-2 text-center transition-colors hover:bg-muted/60"
              >
                <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-card">
                  {store.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={store.logoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-muted-foreground">
                      {store.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="line-clamp-2 text-sm font-medium text-foreground group-hover:underline">
                  {store.name}
                </span>
                {store.location ? (
                  <span className="line-clamp-1 text-xs text-muted-foreground">
                    {store.location}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
