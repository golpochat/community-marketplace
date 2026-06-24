import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { APP_NAME, PLATFORM_LOCALE } from '@community-marketplace/config';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: 'Buy and sell within your community in Ireland',
  manifest: '/manifest.json',
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
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
