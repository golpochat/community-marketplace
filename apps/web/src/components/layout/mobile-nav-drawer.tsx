'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

import type { Category } from '@community-marketplace/types';
import { Button } from '@community-marketplace/ui';
import {
  Heart,
  LayoutDashboard,
  LayoutGrid,
  List,
  LogOut,
  MessageSquare,
  Package,
  Plus,
  Settings,
  Shield,
  ShoppingBag,
  Store,
  UserPlus,
  X,
} from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { getCategoryIcon } from '@/lib/category-icons';
import type { UserMenuItem, UserNavLinks } from '@/lib/user-nav-routes';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';
import { listingsService } from '@/services/listings.service';

const MOBILE_MENU_ICONS = {
  dashboard: LayoutDashboard,
  list: List,
  messages: MessageSquare,
  heart: Heart,
  package: Package,
  settings: Settings,
  shield: Shield,
  plus: Plus,
} as const;

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  userDisplayName?: string;
  navLinks: UserNavLinks | null;
  menuItems: UserMenuItem[];
  sellHref: string;
  onSignOut: () => void | Promise<void>;
  hideSignIn?: boolean;
  hideJoin?: boolean;
}

export function MobileNavDrawer({
  open,
  onClose,
  isAuthenticated,
  userDisplayName,
  navLinks,
  menuItems,
  sellHref,
  onSignOut,
  hideSignIn = false,
  hideJoin = false,
}: MobileNavDrawerProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!open) return;
    void listingsService.getCategories().then(setCategories);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 flex w-[min(100vw,320px)] flex-col border-r border-border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <Logo size="nav" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors duration-150 hover:bg-muted"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="Mobile navigation">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Categories
          </p>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => {
              const Icon = getCategoryIcon(category);
              return (
                <Link
                  key={category.id}
                  href={`/listings?categoryId=${category.id}`}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-3 text-sm font-medium text-foreground hover:border-primary/30 hover:bg-primary/5"
                  onClick={onClose}
                >
                  <Icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
                  <span className="truncate">{category.name}</span>
                </Link>
              );
            })}
          </div>
          <Link
            href="/listings"
            className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary"
            onClick={onClose}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden />
            View all categories
          </Link>

          <div className="my-4 border-t border-border" />

          <div className="space-y-1">
            <Link
              href={WEB_APP_ROUTES.listings}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium text-foreground hover:bg-muted"
              onClick={onClose}
            >
              <ShoppingBag className="h-5 w-5 text-primary" aria-hidden />
              Buy
            </Link>
            <Link
              href={sellHref}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium text-foreground hover:bg-muted"
              onClick={onClose}
            >
              <Store className="h-5 w-5 text-primary" aria-hidden />
              Sell
            </Link>
          </div>

          <div className="my-4 border-t border-border" />

          {isAuthenticated && navLinks && menuItems.length > 0 ? (
            <div className="space-y-1">
              {userDisplayName && (
                <p className="px-3 py-2 text-sm font-semibold text-foreground">{userDisplayName}</p>
              )}
              {menuItems.map((item) => (
                <MobileNavLink
                  key={item.href}
                  href={item.href}
                  icon={MOBILE_MENU_ICONS[item.icon]}
                  label={item.label}
                  onClose={onClose}
                />
              ))}
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[15px] font-medium text-red-600 hover:bg-red-50"
                onClick={() => {
                  onClose();
                  void onSignOut();
                }}
              >
                <LogOut className="h-5 w-5" aria-hidden />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {!hideSignIn ? (
                <Link href={WEB_APP_ROUTES.login} onClick={onClose}>
                  <Button variant="outline" className="h-11 w-full text-[15px] font-semibold">
                    Sign in
                  </Button>
                </Link>
              ) : null}
              {!hideJoin ? (
                <Link href={WEB_APP_ROUTES.register} onClick={onClose}>
                  <Button className="h-11 w-full text-[15px] font-semibold">
                    <UserPlus className="mr-2 h-4 w-4" aria-hidden />
                    Join free
                  </Button>
                </Link>
              ) : null}
            </div>
          )}
        </nav>

        {isAuthenticated && (
          <div className="border-t border-border p-4">
            <Link href={sellHref} onClick={onClose}>
              <Button className="h-11 w-full text-[15px] font-semibold">Sell an item</Button>
            </Link>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function MobileNavLink({
  href,
  icon: Icon,
  label,
  onClose,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium text-foreground hover:bg-muted"
      onClick={onClose}
    >
      <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
      {label}
    </Link>
  );
}
