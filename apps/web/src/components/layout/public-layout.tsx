'use client';

import { usePathname } from 'next/navigation';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { isAuthRoute } from '@/lib/rbac-routes';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const pathname = usePathname() ?? '';
  const authPage = isAuthRoute(pathname);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />
      <main className={authPage ? 'flex min-h-0 flex-1 flex-col' : 'flex-1'}>{children}</main>
      <Footer />
    </div>
  );
}
