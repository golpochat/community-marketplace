import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { APP_NAME, PLATFORM_LOCALE } from '@community-marketplace/config';

import { ServiceWorkerCleanup } from '@/components/dev/service-worker-cleanup';

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
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={PLATFORM_LOCALE}>
      <body className={`${inter.variable} font-sans`}>
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
        {children}
      </body>
    </html>
  );
}
