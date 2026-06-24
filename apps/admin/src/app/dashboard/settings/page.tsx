import { SettingsPanel } from '@/components/settings/settings-panel';
import { requireAdminPermission } from '@/lib/server-rbac';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  await requireAdminPermission('settings');

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">System Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Platform configuration (Super Admin only)</p>
      <div className="mt-8">
        <SettingsPanel />
      </div>
    </div>
  );
}
