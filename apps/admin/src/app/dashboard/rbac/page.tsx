import { AdminsPanel, RbacPanel } from '@/components/rbac/rbac-panel';
import { requireAdminPermission } from '@/lib/server-rbac';

export const metadata = { title: 'RBAC' };

export default async function RbacPage() {
  await requireAdminPermission('rbac');

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">RBAC Management</h1>
      <p className="mt-1 text-sm text-muted-foreground">Roles and permissions matrix</p>
      <div className="mt-8">
        <RbacPanel />
      </div>
    </div>
  );
}
