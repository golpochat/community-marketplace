'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import type { Category } from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';
import { ChevronDown, LayoutGrid } from 'lucide-react';

import { getCategoryIcon } from '@/lib/category-icons';
import { listingsService } from '@/services/listings.service';

const MEGA_MENU_LIMIT = 12;

interface NavCategoriesDropdownProps {
  className?: string;
  onNavigate?: () => void;
}

export function NavCategoriesDropdown({ className, onNavigate }: NavCategoriesDropdownProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void listingsService.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openMenu = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setOpen(true);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => setOpen(false), 120);
  }, []);

  const visible = categories.slice(0, MEGA_MENU_LIMIT);
  const hasMore = categories.length > MEGA_MENU_LIMIT;

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[15px] font-medium text-gray-700 transition-all duration-200 hover:text-primary',
          open && 'text-primary',
        )}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((prev) => !prev)}
      >
        Categories
        <ChevronDown
          className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-[min(100vw-2rem,520px)] rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
          role="menu"
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {visible.map((category) => {
              const Icon = getCategoryIcon(category);
              return (
                <Link
                  key={category.id}
                  href={`/listings?categoryId=${category.id}`}
                  role="menuitem"
                  className="flex flex-col items-center gap-2 rounded-lg border border-transparent px-2 py-3 text-center transition-colors hover:border-primary/20 hover:bg-primary/5"
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="text-sm font-medium leading-tight text-gray-800">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {hasMore && (
            <Link
              href="/listings"
              className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              View all categories
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
