'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAdminAuth } from '@/hooks/use-admin-auth';
import { ADMIN_APP_ROUTES, getAdminDashboardBaseForRole, getSearchDashboardPathForRole } from '@/lib/rbac-routes';

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAdminAuth();
  const searchHref = user ? getSearchDashboardPathForRole(user.role) : ADMIN_APP_ROUTES.search;
  const dashboardBase = user ? getAdminDashboardBaseForRole(user.role) : ADMIN_APP_ROUTES.adminDashboard;

  const navItems = [
    { href: dashboardBase, label: 'Overview', exact: true },
    { href: `${dashboardBase}/users`, label: 'Users' },
    { href: `${dashboardBase}/listings`, label: 'Listings' },
    { href: `${dashboardBase}/analytics`, label: 'Analytics' },
    { href: searchHref, label: 'Search' },
    { href: `${dashboardBase}/settings`, label: 'Settings' },
    ...(user?.role === 'SUPER_ADMIN'
      ? [{ href: ADMIN_APP_ROUTES.superAdminDashboard, label: 'Super Admin', exact: true }]
      : []),
  ];

  return (
    <aside className="hidden w-64 shrink-0 bg-slate-900 text-white md:block">
      <div className="border-b border-slate-800 p-6">
        <p className="text-lg font-semibold">CM Admin</p>
        <p className="text-xs text-gray-400">Community Marketplace</p>
      </div>
      <nav className="space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={`${item.label}-${item.href}`}
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
