'use client';

import type {
  StoreContactSettings,
  StoreOpeningHours,
  StorePolicy,
  StoreWeekday,
} from '@community-marketplace/types';
import { Button, Input, Label } from '@community-marketplace/ui';
import {
  DEFAULT_STORE_OPENING_HOURS,
  DEFAULT_STORE_POLICIES,
} from '@community-marketplace/utils';

const TEXTAREA_CLASSES =
  'flex min-h-[4.5rem] w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))]';

const WEEKDAYS: StoreWeekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const WEEKDAY_LABELS: Record<StoreWeekday, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export const EMPTY_STORE_CONTACT: StoreContactSettings = {
  phone: '',
  email: '',
  addressLine: '',
  website: '',
  showPhone: false,
  showEmail: false,
  showAddress: true,
};

export function mergeStoreContact(
  value?: StoreContactSettings,
): StoreContactSettings {
  return {
    ...EMPTY_STORE_CONTACT,
    ...value,
    showAddress: value?.showAddress !== false,
  };
}

export function mergeStoreOpeningHours(
  value?: StoreOpeningHours,
): StoreOpeningHours {
  if (!value?.schedule) {
    return structuredClone(DEFAULT_STORE_OPENING_HOURS);
  }
  return {
    timezone: value.timezone ?? DEFAULT_STORE_OPENING_HOURS.timezone,
    note: value.note ?? '',
    schedule: { ...DEFAULT_STORE_OPENING_HOURS.schedule, ...value.schedule },
  };
}

export function mergeStorePolicies(value?: StorePolicy): StorePolicy {
  return {
    returns: value?.returns ?? DEFAULT_STORE_POLICIES.returns ?? '',
    shipping: value?.shipping ?? DEFAULT_STORE_POLICIES.shipping ?? '',
    responseTime: value?.responseTime ?? DEFAULT_STORE_POLICIES.responseTime ?? '',
  };
}

interface StorePublicDetailsFormProps {
  contact: StoreContactSettings;
  openingHours: StoreOpeningHours;
  policies: StorePolicy;
  onContactChange: (value: StoreContactSettings) => void;
  onOpeningHoursChange: (value: StoreOpeningHours) => void;
  onPoliciesChange: (value: StorePolicy) => void;
}

export function StorePublicDetailsForm({
  contact,
  openingHours,
  policies,
  onContactChange,
  onOpeningHoursChange,
  onPoliciesChange,
}: StorePublicDetailsFormProps) {
  function updateDay(day: StoreWeekday, patch: Partial<{ closed: boolean; open: string; close: string }>) {
    const current = openingHours.schedule[day] ?? {};
    const next = { ...current, ...patch };
    onOpeningHoursChange({
      ...openingHours,
      schedule: { ...openingHours.schedule, [day]: next },
    });
  }

  return (
    <div className="space-y-8 border-t border-gray-100 pt-6">
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Contact on your storefront</h3>
          <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Shown to buyers on this shop only. Your login email stays private unless you add it here.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="store-contact-phone">Shop phone</Label>
            <Input
              id="store-contact-phone"
              type="tel"
              value={contact.phone ?? ''}
              onChange={(e) => onContactChange({ ...contact, phone: e.target.value })}
              placeholder="+353 87 000 0000"
            />
          </div>
          <div>
            <Label htmlFor="store-contact-email">Shop email</Label>
            <Input
              id="store-contact-email"
              type="email"
              value={contact.email ?? ''}
              onChange={(e) => onContactChange({ ...contact, email: e.target.value })}
              placeholder="shop@example.com"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="store-contact-address">Street address</Label>
            <Input
              id="store-contact-address"
              value={contact.addressLine ?? ''}
              onChange={(e) => onContactChange({ ...contact, addressLine: e.target.value })}
              placeholder="14 Grafton Street, Dublin 2"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="store-contact-website">Website</Label>
            <Input
              id="store-contact-website"
              type="url"
              value={contact.website ?? ''}
              onChange={(e) => onContactChange({ ...contact, website: e.target.value })}
              placeholder="https://"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(contact.showPhone)}
              onChange={(e) => onContactChange({ ...contact, showPhone: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            Show phone publicly
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(contact.showEmail)}
              onChange={(e) => onContactChange({ ...contact, showEmail: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            Show email publicly
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={contact.showAddress !== false}
              onChange={(e) => onContactChange({ ...contact, showAddress: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            Show address publicly
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Opening hours</h3>
            <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Standard hours are pre-filled. Adjust or mark days as closed.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={() => onOpeningHoursChange(structuredClone(DEFAULT_STORE_OPENING_HOURS))}
          >
            Reset to standard hours
          </Button>
        </div>
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {WEEKDAYS.map((day) => {
            const hours = openingHours.schedule[day];
            const closed = Boolean(hours?.closed);
            return (
              <li key={day} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
                <span className="w-24 font-medium text-gray-700">{WEEKDAY_LABELS[day]}</span>
                <label className="flex items-center gap-2 text-gray-600">
                  <input
                    type="checkbox"
                    checked={!closed}
                    onChange={(e) =>
                      updateDay(day, e.target.checked ? { closed: false } : { closed: true })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Open
                </label>
                {!closed && (
                  <>
                    <Input
                      type="time"
                      value={hours?.open ?? '09:00'}
                      onChange={(e) => updateDay(day, { open: e.target.value })}
                      className="w-[7.5rem]"
                    />
                    <span className="text-gray-400">–</span>
                    <Input
                      type="time"
                      value={hours?.close ?? '18:00'}
                      onChange={(e) => updateDay(day, { close: e.target.value })}
                      className="w-[7.5rem]"
                    />
                  </>
                )}
              </li>
            );
          })}
        </ul>
        <div>
          <Label htmlFor="store-hours-note">Note (optional)</Label>
          <Input
            id="store-hours-note"
            value={openingHours.note ?? ''}
            onChange={(e) => onOpeningHoursChange({ ...openingHours, note: e.target.value })}
            placeholder="e.g. Closed on public holidays"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Seller policies</h3>
            <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Buyer-facing policies for this storefront. Edit the template text to match how you sell.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={() => onPoliciesChange({ ...DEFAULT_STORE_POLICIES })}
          >
            Reset to template
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="store-policy-returns">Returns</Label>
            <textarea
              id="store-policy-returns"
              rows={2}
              value={policies.returns ?? ''}
              onChange={(e) => onPoliciesChange({ ...policies, returns: e.target.value })}
              className={TEXTAREA_CLASSES}
            />
          </div>
          <div>
            <Label htmlFor="store-policy-shipping">Shipping & collection</Label>
            <textarea
              id="store-policy-shipping"
              rows={2}
              value={policies.shipping ?? ''}
              onChange={(e) => onPoliciesChange({ ...policies, shipping: e.target.value })}
              className={TEXTAREA_CLASSES}
            />
          </div>
          <div>
            <Label htmlFor="store-policy-response">Response time</Label>
            <Input
              id="store-policy-response"
              value={policies.responseTime ?? ''}
              onChange={(e) => onPoliciesChange({ ...policies, responseTime: e.target.value })}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
