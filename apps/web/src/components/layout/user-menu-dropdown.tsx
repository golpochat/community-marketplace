'use client';

import Link from 'next/link';

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from '@community-marketplace/ui';
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  List,
  LogOut,
  MessageSquare,
  Moon,
  Settings,
  Sun,
} from 'lucide-react';

import { useTheme } from '@/providers/theme-provider';

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
  const { theme, toggle } = useTheme();
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
    <DropdownMenuPortal
      className={className}
      menuClassName="w-56 p-0"
      trigger={
        <button
          type="button"
          className="flex items-center gap-2 rounded-full p-0.5 transition-all duration-150 hover:ring-2 hover:ring-primary/20"
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
            className="hidden h-4 w-4 text-muted-foreground lg:block"
            aria-hidden
          />
        </button>
      }
    >
      <DropdownMenuLabel className="border-b border-border">
        <p className="truncate">{displayName}</p>
        {user.email ? (
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
        ) : null}
      </DropdownMenuLabel>
      <div className="p-1.5">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted hover:text-primary"
          >
            <item.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
            {item.label}
          </Link>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-3" onClick={toggle}>
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-muted-foreground" aria-hidden />
          ) : (
            <Moon className="h-4 w-4 text-muted-foreground" aria-hidden />
          )}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          className="gap-3"
          onClick={() => void onSignOut()}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign Out
        </DropdownMenuItem>
      </div>
    </DropdownMenuPortal>
  );
}
