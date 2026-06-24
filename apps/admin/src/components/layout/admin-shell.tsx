import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminProviders } from '@/components/providers/admin-providers';

interface AdminShellProps {
  children: React.ReactNode;
  variant?: 'admin' | 'super-admin';
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <AdminProviders>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </AdminProviders>
  );
}

/** @deprecated Use AdminShell */
export const AdminLayout = AdminShell;
/** Super-admin uses the same shell with permission-filtered navigation */
export const SuperAdminLayout = AdminShell;
