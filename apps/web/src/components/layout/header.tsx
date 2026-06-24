'use client';

import Link from 'next/link';

import { Button } from '@community-marketplace/ui';

import { useAuth } from '@/hooks/use-auth';

export function Header() {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold text-primary">
          Community Marketplace
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/listings" className="text-sm text-gray-600 hover:text-gray-900">
            Listings
          </Link>
          <Link href="/chat" className="text-sm text-gray-600 hover:text-gray-900">
            Chat
          </Link>
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <span className="text-sm text-gray-500">{user?.email}</span>
            </>
          ) : (
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
