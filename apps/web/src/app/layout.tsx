import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { APP_NAME, APP_SHORT_NAME, PLATFORM_LOCALE } from '@community-marketplace/config';

import { SiteAnalytics } from '@/components/analytics/site-analytics';
import { WebVitalsReporter } from '@/components/analytics/web-vitals-reporter';
import { ServiceWorkerCleanup } from '@/components/dev/service-worker-cleanup';
import { ServiceWorkerRecovery } from '@/components/pwa/service-worker-recovery';
import { AppProviders } from '@/providers/app-providers';
import { getAppUrl } from '@/lib/site-url';
import { DEFAULT_OG_DESCRIPTION, DEFAULT_OG_TITLE, DEFAULT_OPEN_GRAPH, DEFAULT_TWITTER } from '@/lib/seo/og-default';

import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: DEFAULT_OG_TITLE,
    template: `%s | ${APP_NAME}`,
  },
  description: DEFAULT_OG_DESCRIPTION,
  applicationName: APP_SHORT_NAME,
  openGraph: DEFAULT_OPEN_GRAPH,
  twitter: DEFAULT_TWITTER,
  ...(googleSiteVerification
    ? { verification: { google: googleSiteVerification } }
    : {}),
  icons: {
    icon: [
      { url: '/icons/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.ico', sizes: '48x48', type: 'image/png' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_SHORT_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0D9488' },
    { media: '(prefers-color-scheme: dark)', color: '#0F766E' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={PLATFORM_LOCALE} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ServiceWorkerRecovery />
        {process.env.NODE_ENV === 'development' ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(() => {
                if (!('serviceWorker' in navigator)) return;
                navigator.serviceWorker.getRegistrations().then((regs) => {
                  regs.forEach((r) => r.unregister());
                });
                if ('caches' in window) {
                  caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
                }
              })();`,
            }}
          />
        ) : null}
        <ServiceWorkerCleanup />
        <SiteAnalytics />
        <WebVitalsReporter />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
