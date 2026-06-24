import Link from 'next/link';

export default function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <nav className="space-y-1">
          <Link
            href="/buyer/dashboard"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Overview
          </Link>
          <Link
            href="/listings"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Browse Listings
          </Link>
          <Link
            href="/buyer/search"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Search
          </Link>
          <Link
            href="/buyer/notifications"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Notifications
          </Link>
          <Link
            href="/buyer/payments"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Payments
          </Link>
          <Link
            href="/buyer/dashboard/chat"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Messages
          </Link>
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
