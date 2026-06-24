import { Button } from '@community-marketplace/ui';

export const metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <Button>Create Listing</Button>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {['Active Listings', 'Messages', 'Saved Items'].map((label) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
          </div>
        ))}
      </div>
    </div>
  );
}
