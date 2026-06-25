'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button, cn } from '@community-marketplace/ui';
import { Menu, X } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { UserMenuDropdown } from '@/components/layout/user-menu-dropdown';
import { NotificationBell } from '@/components/shared/notification-bell';
import { useAuth } from '@/hooks/use-auth';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';
import { authService } from '@/services/auth.service';
import { getUserNavLinks } from '@/lib/user-nav-routes';

const NAV_LINKS = [
  { href: WEB_APP_ROUTES.listings, label: 'Listings' },
  { href: '/#categories', label: 'Categories' },
  { href: '/about', label: 'About' },
  { href: '/help', label: 'Help' },
] as const;

export function Header() {
  const { user, session, isAuthenticated, clearUser, dashboardPath } = useAuth();
  const hasAuthState = isAuthenticated || !!user;
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = user && dashboardPath ? getUserNavLinks(user.role, dashboardPath) : null;

  const notificationsHref =
    user?.role === 'SELLER'
      ? WEB_APP_ROUTES.sellerNotifications
      : user?.role === 'SUPER_ADMIN'
        ? '/super-admin/notifications'
        : user?.role === 'ADMIN'
          ? '/admin/notifications'
          : WEB_APP_ROUTES.buyerNotifications;

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
      window.location.href = WEB_APP_ROUTES.login;
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo size="sm" />

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-600 transition-all duration-200 hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {hasAuthState && user && navLinks ? (
            <>
              <Link href={navLinks.sellItem}>
                <Button size="sm" className="transition-all duration-200">
                  Sell an Item
                </Button>
              </Link>
              {user.role && <NotificationBell href={notificationsHref} role={user.role} />}
              <UserMenuDropdown
                user={user}
                links={navLinks}
                onSignOut={handleSignOut}
              />
            </>
          ) : (
            <>
              <Link href={WEB_APP_ROUTES.register}>
                <Button size="sm" className="transition-all duration-200">
                  Join Now
                </Button>
              </Link>
              <Link href={WEB_APP_ROUTES.login}>
                <Button variant="outline" size="sm" className="transition-all duration-200">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-brand-md p-2 text-gray-700 transition-all duration-200 hover:bg-gray-100 md:hidden"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          'overflow-hidden border-t border-gray-200/80 bg-white/95 backdrop-blur-md transition-all duration-200 md:hidden',
          mobileOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <nav className="mx-auto max-w-6xl space-y-1 px-4 py-3" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-brand-md px-3 py-2 text-sm text-gray-700 transition-all duration-200 hover:bg-gray-50"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-3 border-t border-gray-100 pt-3">
            {hasAuthState && user && navLinks ? (
              <div className="space-y-2">
                <Link href={navLinks.sellItem} onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Sell an Item</Button>
                </Link>
                <Link
                  href={navLinks.dashboard}
                  className="block rounded-brand-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href={navLinks.myListings}
                  className="block rounded-brand-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  My Listings
                </Link>
                <Link
                  href={navLinks.messages}
                  className="block rounded-brand-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Messages
                </Link>
                <Link
                  href={navLinks.notifications}
                  className="block rounded-brand-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Notifications
                </Link>
                <Link
                  href={navLinks.settings}
                  className="block rounded-brand-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Settings
                </Link>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMobileOpen(false);
                    void handleSignOut();
                  }}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href={WEB_APP_ROUTES.register} onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Join Now</Button>
                </Link>
                <Link href={WEB_APP_ROUTES.login} onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
