'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { useSidebar } from './sidebar-context';

/** Closes the mobile drawer on navigation and locks body scroll while open. */
export function MobileSidebarEffects() {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen } = useSidebar();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen, setMobileOpen]);

  return null;
}
