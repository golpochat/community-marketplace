import { NotificationsPanel } from '@/components/notifications/notifications-panel';
import { requireAdminPermission } from '@/lib/server-rbac';

export const metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  await requireAdminPermission('notifications');

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
      <p className="mt-1 text-sm text-muted-foreground">Templates, providers, and broadcasts</p>
      <div className="mt-8">
        <NotificationsPanel />
      </div>
    </div>
  );
}
