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

import { DashboardCollapsibleSection } from '@/components/dashboard/dashboard-collapsible-section';

const TEXTAREA_CLASSES =
  'flex min-h-[4.5rem] w-full resize-y rounded-md border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))] placeholder:text-[hsl(var(--dashboard-sidebar-muted))] focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))]';

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
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
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

function formatTimeLabel(value: string | undefined): string {
  if (!value) return '';
  const [hour, minute] = value.split(':');
  if (!hour || !minute) return value;
  const h = Number(hour);
  if (Number.isNaN(h)) return value;
  return `${h}:${minute}`;
}

export function formatOpeningHoursSummary(hours: StoreOpeningHours): string {
  const openDays = WEEKDAYS.filter((day) => !hours.schedule[day]?.closed);
  if (openDays.length === 0) return 'Closed every day';

  const segments = openDays.map((day) => {
    const slot = hours.schedule[day];
    return `${WEEKDAY_LABELS[day]} ${formatTimeLabel(slot?.open)}–${formatTimeLabel(slot?.close)}`;
  });

  if (segments.length <= 2) return segments.join(' · ');
  return `${segments[0]} · … · ${segments[segments.length - 1]}`;
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
  const hoursSummary = formatOpeningHoursSummary(openingHours);
  const policiesSummary = policies.responseTime?.trim()
    ? `Returns, shipping, and response time configured`
    : 'Buyer-facing policy text';

  function updateDay(day: StoreWeekday, patch: Partial<{ closed: boolean; open: string; close: string }>) {
    const current = openingHours.schedule[day] ?? {};
    const next = { ...current, ...patch };
    onOpeningHoursChange({
      ...openingHours,
      schedule: { ...openingHours.schedule, [day]: next },
    });
  }

  return (
    <div className="space-y-4">
      <DashboardCollapsibleSection
        title="Contact on your storefront"
        description={
          'Shop contact details for buyers'
        }
        defaultOpen={false}
      >
        <div className="space-y-4">
          <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Shown to buyers on this shop only. Your login email stays private unless you add it here.
          </p>
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
                className="h-4 w-4 rounded border-[hsl(var(--dashboard-sidebar-border))]"
              />
              Show phone publicly
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(contact.showEmail)}
                onChange={(e) => onContactChange({ ...contact, showEmail: e.target.checked })}
                className="h-4 w-4 rounded border-[hsl(var(--dashboard-sidebar-border))]"
              />
              Show email publicly
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={contact.showAddress !== false}
                onChange={(e) => onContactChange({ ...contact, showAddress: e.target.checked })}
                className="h-4 w-4 rounded border-[hsl(var(--dashboard-sidebar-border))]"
              />
              Show address publicly
            </label>
          </div>
        </div>
      </DashboardCollapsibleSection>

      <DashboardCollapsibleSection
        title="Opening hours"
        description={hoursSummary}
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Standard hours are pre-filled. Adjust or mark days as closed.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => onOpeningHoursChange(structuredClone(DEFAULT_STORE_OPENING_HOURS))}
            >
              Reset to standard hours
            </Button>
          </div>
          <ul className="divide-y divide-[hsl(var(--dashboard-sidebar-border))] rounded-lg border border-[hsl(var(--dashboard-sidebar-border))]">
            {WEEKDAYS.map((day) => {
              const hours = openingHours.schedule[day];
              const closed = Boolean(hours?.closed);
              return (
                <li key={day} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
                  <span className="w-24 font-medium capitalize text-[hsl(var(--dashboard-main-fg))]">
                    {day}
                  </span>
                  <label className="flex items-center gap-2 text-[hsl(var(--dashboard-sidebar-muted))]">
                    <input
                      type="checkbox"
                      checked={!closed}
                      onChange={(e) =>
                        updateDay(day, e.target.checked ? { closed: false } : { closed: true })
                      }
                      className="h-4 w-4 rounded border-[hsl(var(--dashboard-sidebar-border))]"
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
                      <span className="text-[hsl(var(--dashboard-sidebar-muted))]">–</span>
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
        </div>
      </DashboardCollapsibleSection>

      <DashboardCollapsibleSection
        title="Seller policies"
        description={policiesSummary}
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Buyer-facing policies for this storefront. Edit the template text to match how you sell.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
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
        </div>
      </DashboardCollapsibleSection>
    </div>
  );
}
