'use client';

import Link from 'next/link';

import { Button } from '@community-marketplace/ui';

import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';
import { NotificationBell } from '@/components/shared/notification-bell';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

export function Header() {
  const { user, session, isAuthenticated, clearUser, dashboardPath } = useAuth();
  const hasAuthState = isAuthenticated || !!user;

  const notificationsHref =
    user?.role === 'SELLER' ? WEB_APP_ROUTES.sellerNotifications : WEB_APP_ROUTES.buyerNotifications;

  async function handleSignOut() {
    try {
      if (session?.refreshToken || session?.sessionId) {
        await authService.logout({
          refreshToken: session.refreshToken,
          sessionId: session.sessionId,
        });
      }
    } catch {
      // Clear local session even if the API logout fails
    } finally {
      clearUser();
      window.location.href = '/auth/login';
    }
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold text-primary">
          Community Marketplace
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
          <Link href="/listings" className="text-sm text-gray-600 hover:text-gray-900">
            Listings
          </Link>
          <Link href="/about" className="hidden text-sm text-gray-600 hover:text-gray-900 sm:inline">
            About
          </Link>
          <Link href="/help" className="hidden text-sm text-gray-600 hover:text-gray-900 sm:inline">
            Help
          </Link>
          {hasAuthState ? (
            <>
              {user?.role && (
                <NotificationBell
                  href={notificationsHref}
                  role={user.role === 'SELLER' ? 'SELLER' : 'BUYER'}
                />
              )}
              <Link
                href={dashboardPath ?? '/dashboard'}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              {user?.email ? (
                <span className="hidden text-sm text-gray-500 md:inline">{user.email}</span>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                className="text-gray-700"
                onClick={() => void handleSignOut()}
              >
                Sign Out
              </Button>
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
