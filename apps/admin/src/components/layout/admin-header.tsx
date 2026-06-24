'use client';

import { Button } from '@community-marketplace/ui';

import { useAdminAuth } from '@/hooks/use-admin-auth';

export function AdminHeader() {
  const { user, clearUser } = useAdminAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <p className="text-sm text-gray-600">Administration Panel</p>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">{user?.email ?? 'admin@community.market'}</span>
        <Button variant="ghost" onClick={clearUser}>
          Sign Out
        </Button>
      </div>
    </header>
  );
}
