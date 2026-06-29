'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button, cn } from '@community-marketplace/ui';
import { Menu } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { MobileNavDrawer } from '@/components/layout/mobile-nav-drawer';
import { NavCategoriesDropdown } from '@/components/layout/nav-categories-dropdown';
import { UserMenuDropdown } from '@/components/layout/user-menu-dropdown';
import { NotificationBell } from '@/components/shared/notification-bell';
import { useAuth } from '@/hooks/use-auth';
import { useUserProfile } from '@/hooks/use-user-profile';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';
import { getUserNavLinks } from '@/lib/user-nav-routes';
import { authService } from '@/services/auth.service';

const NAV_LINK_CLASS =
  'rounded-md px-3 py-2 text-[15px] font-medium text-gray-700 transition-all duration-200 hover:text-primary';

function getSellHref(isAuthenticated: boolean, sellItem?: string): string {
  const target = sellItem ?? '/seller/listings/create';
  if (isAuthenticated) return target;
  return WEB_APP_ROUTES.login;
}

function isBuyRoute(pathname: string): boolean {
  return pathname === WEB_APP_ROUTES.listings || pathname.startsWith('/listings/');
}

function isSellRoute(pathname: string): boolean {
  return pathname.startsWith('/seller');
}

function HeaderNavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(NAV_LINK_CLASS, active && 'text-primary')}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const { user, session, isAuthenticated, clearUser, dashboardPath } = useAuth();
  const { profile } = useUserProfile();
  const hasAuthState = isAuthenticated || !!user;
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = user && dashboardPath ? getUserNavLinks(user.role, dashboardPath) : null;
  const menuUser = user
    ? {
        ...user,
        displayName: profile?.displayName ?? user.displayName,
        avatarUrl: profile?.avatarUrl ?? user.avatarUrl,
      }
    : null;
  const sellHref = getSellHref(hasAuthState, navLinks?.sellItem);
  const buyActive = isBuyRoute(pathname);
  const sellActive = isSellRoute(pathname);

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
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200/50 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-1 md:gap-3">
            <Logo size="nav" />
            <div className="hidden md:block">
              <NavCategoriesDropdown />
            </div>
            <nav
              className="ml-1 hidden items-center gap-1 md:flex"
              aria-label="Primary navigation"
            >
              <HeaderNavLink href={WEB_APP_ROUTES.listings} active={buyActive}>
                Buy
              </HeaderNavLink>
              {!hasAuthState && (
                <HeaderNavLink href={sellHref} active={sellActive}>
                  Sell
                </HeaderNavLink>
              )}
            </nav>
          </div>

          <div className="hidden shrink-0 items-center gap-3 md:flex">
            {hasAuthState && user && navLinks && menuUser ? (
              <>
                <Link href={sellHref} aria-current={sellActive ? 'page' : undefined}>
                  <Button className="h-10 rounded-md px-4 text-[15px] font-semibold transition-all duration-200">
                    Sell
                  </Button>
                </Link>
                {user.role && <NotificationBell href={notificationsHref} role={user.role} />}
                <UserMenuDropdown user={menuUser} links={navLinks} onSignOut={handleSignOut} />
              </>
            ) : (
              <>
                <Link href={WEB_APP_ROUTES.login} className={NAV_LINK_CLASS}>
                  Sign In
                </Link>
                <Link href={WEB_APP_ROUTES.register}>
                  <Button className="h-10 rounded-md px-4 text-[15px] font-semibold transition-all duration-200">
                    Join Now
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 transition-all duration-200 hover:bg-gray-100 md:hidden"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      <MobileNavDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isAuthenticated={hasAuthState}
        userDisplayName={user?.displayName ?? user?.email ?? undefined}
        navLinks={navLinks}
        sellHref={sellHref}
        onSignOut={handleSignOut}
      />
    </>
  );
}
