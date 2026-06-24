import { VerificationsPanel } from '@/components/verifications/verifications-panel';
import { requireAdminPermission } from '@/lib/server-rbac';
import { adminServerService } from '@/services/admin.service.server';

export const metadata = { title: 'Verifications' };

export default async function VerificationsPage() {
  await requireAdminPermission('verifications');
  const data = await adminServerService.getPendingVerifications();
  const items = (data as { data?: unknown[] }).data ?? (Array.isArray(data) ? data : []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Seller Verifications</h1>
      <p className="mt-1 text-sm text-muted-foreground">Review and approve identity documents</p>
      <div className="mt-8">
        <VerificationsPanel initial={items as Parameters<typeof VerificationsPanel>[0]['initial']} />
      </div>
    </div>
  );
}
