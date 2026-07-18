'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@community-marketplace/ui';
import { BrandAvatar } from '@community-marketplace/ui';
import { BadgeCheck, ChevronDown, LogOut, Medal, Settings, User } from 'lucide-react';

export interface ProfileDropdownUser {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

export interface ProfileDropdownProps {
  user: ProfileDropdownUser;
  profileHref: string;
  settingsHref?: string;
  onLogout: () => void | Promise<void>;
  /** Show verified-seller mark next to the display name. */
  verified?: boolean;
  /** Quiet CTA in the menu when the user is not verified (e.g. /account/verification). */
  verifyHref?: string;
}

function pathMatches(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ProfileDropdown({
  user,
  profileHref,
  settingsHref,
  onLogout,
  verified = false,
  verifyHref,
}: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const showSettings = Boolean(settingsHref && settingsHref !== profileHref);
  const profileActive = pathMatches(pathname, profileHref);
  const settingsActive = showSettings && settingsHref ? pathMatches(pathname, settingsHref) : false;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const displayName = user.name?.trim() || user.email || 'Account';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 max-w-full items-center gap-2 rounded-lg px-1.5 text-sm transition-colors hover:bg-[hsl(var(--dashboard-sidebar-active)/0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--dashboard-accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--dashboard-topbar-bg))]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <BrandAvatar src={user.avatarUrl} alt={displayName} size="xs" />
        <span className="hidden min-w-0 items-center gap-1 sm:inline-flex">
          <span className="max-w-[140px] truncate text-left">{displayName}</span>
          {verified ? (
            <span
              className="inline-flex shrink-0 text-emerald-600"
              title="Verified seller"
              aria-label="Verified seller"
              role="img"
            >
              <BadgeCheck className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </span>
          ) : null}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 opacity-60 transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[min(16rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] shadow-lg"
        >
          <div className="border-b border-[hsl(var(--dashboard-sidebar-border))] px-4 py-3">
            <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-[hsl(var(--dashboard-topbar-fg))]">
              <span className="truncate">{displayName}</span>
              {verified ? (
                <span
                  className="inline-flex shrink-0 text-emerald-600"
                  title="Verified seller"
                  aria-label="Verified seller"
                  role="img"
                >
                  <BadgeCheck className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                </span>
              ) : null}
            </p>
            {user.email ? (
              <p className="truncate text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{user.email}</p>
            ) : null}
          </div>
          <div className="py-1">
            <Link
              href={profileHref}
              role="menuitem"
              aria-current={profileActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm text-[hsl(var(--dashboard-topbar-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.3)] sm:py-2',
                profileActive && 'bg-[hsl(var(--dashboard-sidebar-active)/0.35)]',
              )}
              onClick={() => setOpen(false)}
            >
              <User className="h-4 w-4 shrink-0" />
              Profile
            </Link>
            {showSettings && settingsHref ? (
              <Link
                href={settingsHref}
                role="menuitem"
                aria-current={settingsActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm text-[hsl(var(--dashboard-topbar-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.3)] sm:py-2',
                  settingsActive && 'bg-[hsl(var(--dashboard-sidebar-active)/0.35)]',
                )}
                onClick={() => setOpen(false)}
              >
                <Settings className="h-4 w-4 shrink-0" />
                Settings
              </Link>
            ) : null}
            {!verified && verifyHref ? (
              <Link
                href={verifyHref}
                role="menuitem"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[hsl(var(--dashboard-topbar-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.3)] sm:py-2"
                onClick={() => setOpen(false)}
              >
                <Medal className="h-4 w-4 shrink-0" />
                Get verified
              </Link>
            ) : null}
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-500 hover:bg-[hsl(var(--dashboard-sidebar-active)/0.3)] sm:py-2"
              onClick={() => {
                setOpen(false);
                void onLogout();
              }}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
