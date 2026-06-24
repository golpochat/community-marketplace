'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Overview', exact: true },
  { href: '/admin/dashboard/users', label: 'Users' },
  { href: '/admin/dashboard/listings', label: 'Listings' },
  { href: '/admin/dashboard/analytics', label: 'Analytics' },
  { href: '/admin/dashboard/settings', label: 'Settings' },
  { href: '/super-admin/dashboard', label: 'Super Admin', exact: true },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 bg-slate-900 text-white md:block">
      <div className="border-b border-slate-800 p-6">
        <p className="text-lg font-semibold">CM Admin</p>
        <p className="text-xs text-gray-400">Community Marketplace</p>
      </div>
      <nav className="space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-slate-800 text-white' : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
