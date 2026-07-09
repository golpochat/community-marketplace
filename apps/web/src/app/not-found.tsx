import Link from 'next/link';

import { Button } from '@community-marketplace/ui';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground">Page not found</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        The page you are looking for may have moved, sold, or never existed. Try browsing listings or
        return home.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/listings">Browse listings</Link>
        </Button>
      </div>
      <nav aria-label="Helpful links" className="mt-10 text-sm text-muted-foreground">
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          <li>
            <Link href="/help" className="hover:text-foreground">
              Help centre
            </Link>
          </li>
          <li>
            <Link href="/contact" className="hover:text-foreground">
              Contact us
            </Link>
          </li>
          <li>
            <Link href="/about" className="hover:text-foreground">
              About SellNearby
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
