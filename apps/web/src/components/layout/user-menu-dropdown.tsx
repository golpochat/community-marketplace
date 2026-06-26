'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { cn } from '@community-marketplace/ui';
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  List,
  LogOut,
  MessageSquare,
  Settings,
} from 'lucide-react';

import type { UserNavLinks } from '@/lib/user-nav-routes';

export interface UserMenuUser {
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

interface UserMenuDropdownProps {
  user: UserMenuUser;
  links: UserNavLinks;
  onSignOut: () => void | Promise<void>;
  className?: string;
}

function getInitials(displayName?: string | null, email?: string | null): string {
  if (displayName?.trim()) {
    return displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }
  return email?.[0]?.toUpperCase() ?? '?';
}

export function UserMenuDropdown({ user, links, onSignOut, className }: UserMenuDropdownProps) {
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

  const displayName = user.displayName?.trim() || user.email || 'Account';
  const initials = getInitials(user.displayName, user.email);

  const menuItems = [
    { href: links.dashboard, label: 'Dashboard', icon: LayoutDashboard },
    { href: links.myListings, label: 'My Listings', icon: List },
    { href: links.messages, label: 'Messages', icon: MessageSquare },
    ...(links.savedItems
      ? [{ href: links.savedItems, label: 'Saved Items', icon: Heart }]
      : []),
    { href: links.settings, label: 'Settings', icon: Settings },
  ];

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full p-0.5 transition-all duration-200 hover:ring-2 hover:ring-primary/20"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initials}
          </span>
        )}
        <ChevronDown
          className={cn(
            'hidden h-4 w-4 text-gray-500 transition-transform duration-200 lg:block',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
        >
          <div className="border-b border-gray-100 px-3 py-2.5">
            <p className="truncate text-sm font-medium text-gray-900">{displayName}</p>
            {user.email ? <p className="truncate text-xs text-gray-500">{user.email}</p> : null}
          </div>
          <div className="space-y-0.5 py-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-primary"
                onClick={() => setOpen(false)}
              >
                <item.icon className="h-4 w-4 text-gray-500" aria-hidden />
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50"
              onClick={() => {
                setOpen(false);
                void onSignOut();
              }}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign Out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
