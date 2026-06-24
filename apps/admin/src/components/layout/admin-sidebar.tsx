'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { PermissionCode, RbacRole } from '@community-marketplace/types';

import { useAdminAuth } from '@/hooks/use-admin-auth';
import { buildAdminNav } from '@/lib/navigation';
import { getStoredAdminRole } from '@/store/admin-auth.store';
import { adminAuthService } from '@/services/auth.service';

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, permissions, setPermissions } = useAdminAuth();
  const [navItems, setNavItems] = useState<ReturnType<typeof buildAdminNav>>([]);

  useEffect(() => {
    const role = (user?.role ?? getStoredAdminRole()) as RbacRole | null;
    if (!role) return;

    if (permissions.length === 0 && user) {
      const adminRole = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
      void adminAuthService.fetchMe(undefined, adminRole).then((me) => {
        setPermissions(me.permissions as PermissionCode[]);
        setNavItems(buildAdminNav(role, me.permissions as PermissionCode[]));
      });
    } else {
      setNavItems(buildAdminNav(role, permissions));
    }
  }, [user, permissions, setPermissions]);

  return (
    <aside className="hidden w-64 shrink-0 bg-slate-900 text-white dark:bg-slate-950 md:block">
      <div className="border-b border-slate-800 p-6">
        <p className="text-lg font-semibold">CM Admin</p>
        <p className="text-xs text-gray-400">Community Marketplace</p>
      </div>
      <nav className="space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.id}
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
