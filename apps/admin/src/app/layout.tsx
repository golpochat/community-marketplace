import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { APP_NAME, PLATFORM_LOCALE } from '@community-marketplace/config';

import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: `Admin | ${APP_NAME}`,
    template: '%s | Admin',
  },
  description: `${APP_NAME} administration dashboard`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={PLATFORM_LOCALE}>
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
