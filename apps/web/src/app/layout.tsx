import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { APP_NAME, PLATFORM_LOCALE } from '@community-marketplace/config';

import { ServiceWorkerCleanup } from '@/components/dev/service-worker-cleanup';
import { ServiceWorkerRecovery } from '@/components/pwa/service-worker-recovery';
import { AppProviders } from '@/providers/app-providers';

import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: 'Buy and sell within your community in Ireland',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/favicon.ico', sizes: '48x48' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/icons/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
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
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
