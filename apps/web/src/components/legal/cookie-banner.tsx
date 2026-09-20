'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { Button } from '@community-marketplace/ui';

import {
  COOKIE_CONSENT_EVENT,
  readCookieConsent,
  writeCookieConsent,
} from '@/lib/cookie-consent';

const ANALYTICS_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim(),
);

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ANALYTICS_CONFIGURED) return;
    setVisible(readCookieConsent() == null);

    function onChange() {
      setVisible(readCookieConsent() == null);
    }
    window.addEventListener(COOKIE_CONSENT_EVENT, onChange);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onChange);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card p-4 shadow-brand-sm"
      role="dialog"
      aria-labelledby="cookie-banner-title"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p id="cookie-banner-title" className="text-sm font-medium text-foreground">
            Cookies
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Necessary cookies keep you signed in. Optional analytics cookies help us understand
            traffic. See the{' '}
            <Link href="/cookies" className="font-medium text-primary hover:underline">
              cookie policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => writeCookieConsent('necessary')}
          >
            Necessary only
          </Button>
          <Button type="button" size="sm" onClick={() => writeCookieConsent('analytics')}>
            Accept analytics
          </Button>
        </div>
      </div>
    </div>
  );
}
