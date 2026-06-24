import { Button } from '@community-marketplace/ui';
import {
  APP_NAME,
  DEFAULT_CURRENCY,
  PLATFORM_COUNTRY_NAME,
  PLATFORM_LANGUAGE,
  PLATFORM_LOCALE,
  PLATFORM_TIMEZONE,
} from '@community-marketplace/config';

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
            defaultValue={APP_NAME}
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
        <div>
          <label className="block text-sm font-medium text-gray-700">Country</label>
          <input
            type="text"
            defaultValue={PLATFORM_COUNTRY_NAME}
            readOnly
            className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Language</label>
            <input
              type="text"
              defaultValue={PLATFORM_LANGUAGE === 'en' ? 'English' : PLATFORM_LANGUAGE}
              readOnly
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Locale</label>
            <input
              type="text"
              defaultValue={PLATFORM_LOCALE}
              readOnly
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <input
              type="text"
              defaultValue={`${DEFAULT_CURRENCY} (€)`}
              readOnly
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Timezone</label>
            <input
              type="text"
              defaultValue={PLATFORM_TIMEZONE}
              readOnly
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
          </div>
        </div>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}
