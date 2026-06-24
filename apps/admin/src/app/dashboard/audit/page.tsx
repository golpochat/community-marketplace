import { AuditPanel } from '@/components/audit/audit-panel';
import { requireAdminPermission } from '@/lib/server-rbac';

export const metadata = { title: 'Audit Log' };

export default async function AuditPage() {
  await requireAdminPermission('audit');

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Audit Log</h1>
      <p className="mt-1 text-sm text-muted-foreground">Admin action history</p>
      <div className="mt-8">
        <AuditPanel />
      </div>
    </div>
  );
}
