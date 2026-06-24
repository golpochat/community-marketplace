'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

import { getSidebarItemsByRole } from '@community-marketplace/ui-dashboard';
import { Button } from '@community-marketplace/ui';

export function SellerSidebar() {
  const pathname = usePathname();
  const items = getSidebarItemsByRole('SELLER');
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="space-y-1">
      {items.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`block rounded-lg px-3 py-2 text-sm font-medium ${
              isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="mb-4 md:hidden">
        <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
          Menu
        </Button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-64 bg-white p-4 shadow-xl">{nav}</aside>
        </div>
      )}
      <aside className="hidden md:block">{nav}</aside>
    </>
  );
}
