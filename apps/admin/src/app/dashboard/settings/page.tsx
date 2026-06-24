import { Button } from '@community-marketplace/ui';

export const metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
      <p className="mt-1 text-sm text-gray-600">Configure platform settings</p>
      <div className="mt-8 max-w-lg space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Platform Name</label>
          <input
            type="text"
            defaultValue="Community Marketplace"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Support Email</label>
          <input
            type="email"
            defaultValue="support@community.market"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}
