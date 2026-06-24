import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'Community Marketplace',
    template: '%s | Community Marketplace',
  },
  description: 'Buy and sell within your community',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Community Marketplace',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
