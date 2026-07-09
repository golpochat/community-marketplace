'use client';

import { usePathname } from 'next/navigation';

import DashboardLayout from '@/components/dashboard/DashboardLayout';

function isAdminInvitePath(pathname: string): boolean {
  return pathname === '/admin/invite/accept' || pathname.startsWith('/admin/invite/');
}

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isAdminInvitePath(pathname)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--dashboard-main-bg))] px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    );
  }

  return (
    <DashboardLayout role="ADMIN" theme="admin">
      {children}
    </DashboardLayout>
  );
}
