import { AdminsPanel } from '@/components/rbac/rbac-panel';
import { requireAdminPermission } from '@/lib/server-rbac';

export const metadata = { title: 'Admins' };

export default async function AdminsPage() {
  await requireAdminPermission('admins');

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Admin Users</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage platform administrators</p>
      <div className="mt-8">
        <AdminsPanel />
      </div>
    </div>
  );
}
