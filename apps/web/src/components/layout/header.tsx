"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button, cn } from "@community-marketplace/ui";
import { Menu } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { NavCategoriesDropdown } from "@/components/layout/nav-categories-dropdown";
import { UserMenuDropdown } from "@/components/layout/user-menu-dropdown";
import { NotificationBell } from "@/components/shared/notification-bell";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import { WEB_APP_ROUTES, isAuthLoginRoute, isAuthRegisterRoute } from "@/lib/rbac-routes";
import { getUserMenuItems, getUserNavLinks } from "@/lib/user-nav-routes";
import { authService } from "@/services/auth.service";

const NAV_LINK_CLASS =
  "relative rounded-lg px-3 py-2 text-[15px] font-medium text-foreground/75 transition-colors duration-150 hover:text-primary";

function getSellHref(isAuthenticated: boolean, sellItem?: string): string {
  const target = sellItem ?? "/seller/listings/create";
  if (isAuthenticated) return target;
  return WEB_APP_ROUTES.login;
}

function isBuyRoute(pathname: string): boolean {
  return (
    pathname === WEB_APP_ROUTES.listings || pathname.startsWith("/listings/")
  );
}

function isSellRoute(pathname: string): boolean {
  return pathname.startsWith("/seller");
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
      className={cn(
        NAV_LINK_CLASS,
        active &&
          "font-semibold text-primary after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary",
      )}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const { user, session, isAuthenticated, clearUser, dashboardPath } =
    useAuth();
  const { profile } = useUserProfile();
  const hasAuthState = isAuthenticated || !!user;
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks =
    user && dashboardPath ? getUserNavLinks(user.role, dashboardPath) : null;
  const menuItems =
    user && dashboardPath ? getUserMenuItems(user.role, dashboardPath) : [];
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
  const onLoginPage = isAuthLoginRoute(pathname);
  const onRegisterPage = isAuthRegisterRoute(pathname);

  const notificationsHref =
    user?.role === "SELLER"
      ? WEB_APP_ROUTES.sellerNotifications
      : user?.role === "SUPER_ADMIN"
        ? "/super-admin/notifications"
        : user?.role === "ADMIN"
          ? "/admin/notifications"
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
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 shadow-brand-sm backdrop-blur-lg">
        <div className="mx-auto flex h-[4.75rem] max-w-6xl items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-1 md:gap-3">
            <Logo size="nav" />
            <div className="hidden md:block">
              <NavCategoriesDropdown />
            </div>
            <nav
              className="ml-1 hidden items-center gap-0.5 md:flex"
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
                <Link
                  href={sellHref}
                  aria-current={sellActive ? "page" : undefined}
                >
                  <Button size="default" className="shadow-brand-sm">
                    Sell
                  </Button>
                </Link>
                {user.role ? (
                  <NotificationBell href={notificationsHref} variant="site" />
                ) : null}
                <UserMenuDropdown
                  user={menuUser}
                  menuItems={menuItems}
                  onSignOut={handleSignOut}
                />
              </>
            ) : (
              <>
                {!onLoginPage ? (
                  <Link href={WEB_APP_ROUTES.login} className={NAV_LINK_CLASS}>
                    Sign in
                  </Link>
                ) : null}
                {!onRegisterPage ? (
                  <Link href={WEB_APP_ROUTES.register}>
                    <span className="btn-brand-accent inline-flex h-10 items-center px-5">
                      Join free
                    </span>
                  </Link>
                ) : null}
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-foreground/80 transition-colors duration-150 hover:bg-muted md:hidden"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
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
        menuItems={menuItems}
        sellHref={sellHref}
        onSignOut={handleSignOut}
        hideSignIn={onLoginPage}
        hideJoin={onRegisterPage}
      />
    </>
  );
}
