import { PaymentsPanel } from '@/components/payments/payments-panel';
import { requireAdminPermission } from '@/lib/server-rbac';

export const metadata = { title: 'Payments' };

export default async function PaymentsPage() {
  await requireAdminPermission('payments');

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Payments & Finance</h1>
      <p className="mt-1 text-sm text-muted-foreground">Payments, refunds, and disputes</p>
      <div className="mt-8">
        <PaymentsPanel />
      </div>
    </div>
  );
}
