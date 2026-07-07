'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { cn } from '@community-marketplace/ui';
import { BrandAvatar } from '@community-marketplace/ui';
import { ChevronDown, LogOut, Settings, User } from 'lucide-react';

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
}

export function ProfileDropdown({ user, profileHref, settingsHref, onLogout }: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        <span className="hidden max-w-[140px] truncate text-left sm:inline">{displayName}</span>
        <ChevronDown className={cn('h-4 w-4 opacity-60 transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] shadow-lg"
        >
          <div className="border-b border-[hsl(var(--dashboard-sidebar-border))] px-4 py-3">
            <p className="truncate text-sm font-medium text-[hsl(var(--dashboard-topbar-fg))]">{displayName}</p>
            {user.email ? (
              <p className="truncate text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{user.email}</p>
            ) : null}
          </div>
          <div className="py-1">
            <Link
              href={profileHref}
              role="menuitem"
              className="flex items-center gap-2 px-4 py-2 text-sm text-[hsl(var(--dashboard-topbar-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.3)]"
              onClick={() => setOpen(false)}
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            {settingsHref ? (
              <Link
                href={settingsHref}
                role="menuitem"
                className="flex items-center gap-2 px-4 py-2 text-sm text-[hsl(var(--dashboard-topbar-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.3)]"
                onClick={() => setOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            ) : null}
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-500 hover:bg-[hsl(var(--dashboard-sidebar-active)/0.3)]"
              onClick={() => {
                setOpen(false);
                void onLogout();
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
