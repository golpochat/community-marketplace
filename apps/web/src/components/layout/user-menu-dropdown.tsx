'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { cn } from '@community-marketplace/ui';
import {
  Bell,
  ChevronDown,
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
    { href: links.notifications, label: 'Notifications', icon: Bell },
    { href: links.settings, label: 'Settings', icon: Settings },
  ];

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-brand-md px-2 py-1.5 text-sm transition-all duration-200 hover:bg-gray-100"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </span>
        )}
        <span className="hidden max-w-[120px] truncate text-left text-gray-700 md:inline">{displayName}</span>
        <ChevronDown
          className={cn('h-4 w-4 text-gray-500 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-brand-md border border-gray-200 bg-white shadow-brand-lg"
        >
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-gray-900">{displayName}</p>
            {user.email ? <p className="truncate text-xs text-gray-500">{user.email}</p> : null}
          </div>
          <div className="py-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-all duration-200 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                <item.icon className="h-4 w-4 text-gray-500" aria-hidden />
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 transition-all duration-200 hover:bg-red-50"
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
