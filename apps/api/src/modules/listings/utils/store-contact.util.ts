import type {
  StoreContactInfo,
  StoreContactSettings,
  StoreDayHours,
  StoreOpeningHours,
  StorePolicy,
  StoreWeekday,
} from '@community-marketplace/types';
import { parseStoreAddress } from '@community-marketplace/utils';

type LegacyStorePrefs = {
  storeSlug?: string;
  storePolicies?: StorePolicy;
  storeContact?: {
    phone?: string;
    email?: string;
    showPhone?: boolean;
    showEmail?: boolean;
  };
  storeHours?: StoreOpeningHours;
};

type PrivacySettings = {
  showEmail?: boolean;
  showPhone?: boolean;
  showLocation?: boolean;
};

const STORE_WEEKDAYS: StoreWeekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export function normalizeStoreOpeningHours(
  raw: unknown,
): StoreOpeningHours | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const value = raw as StoreOpeningHours;
  if (!value.schedule || typeof value.schedule !== 'object') return undefined;
  const schedule: Partial<Record<StoreWeekday, StoreDayHours>> = {};
  for (const day of STORE_WEEKDAYS) {
    const entry = value.schedule[day];
    if (!entry || typeof entry !== 'object') continue;
    schedule[day] = {
      closed: Boolean(entry.closed),
      open: typeof entry.open === 'string' ? entry.open : undefined,
      close: typeof entry.close === 'string' ? entry.close : undefined,
    };
  }
  if (Object.keys(schedule).length === 0) return undefined;
  return {
    timezone: typeof value.timezone === 'string' ? value.timezone : undefined,
    note: typeof value.note === 'string' ? value.note : undefined,
    schedule,
  };
}

export function parseStoreContactSettings(raw: unknown): StoreContactSettings | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const value = raw as StoreContactSettings;
  const settings: StoreContactSettings = {
    phone: typeof value.phone === 'string' ? value.phone.trim() || undefined : undefined,
    email: typeof value.email === 'string' ? value.email.trim() || undefined : undefined,
    addressLine:
      typeof value.addressLine === 'string' ? value.addressLine.trim() || undefined : undefined,
    website: typeof value.website === 'string' ? value.website.trim() || undefined : undefined,
    showPhone: value.showPhone === true,
    showEmail: value.showEmail === true,
    showAddress: value.showAddress !== false,
  };
  const hasValue = Object.entries(settings).some(([key, entry]) => {
    if (key.startsWith('show')) return entry === true || (key === 'showAddress' && entry === false);
    return Boolean(entry);
  });
  return hasValue ? settings : undefined;
}

export function parseStorePolicies(raw: unknown): StorePolicy | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const value = raw as StorePolicy;
  const policies: StorePolicy = {
    returns: typeof value.returns === 'string' ? value.returns.trim() || undefined : undefined,
    shipping: typeof value.shipping === 'string' ? value.shipping.trim() || undefined : undefined,
    responseTime:
      typeof value.responseTime === 'string' ? value.responseTime.trim() || undefined : undefined,
  };
  const hasValue = Object.values(policies).some(Boolean);
  return hasValue ? policies : undefined;
}

export function readStorePrefs(raw: unknown): LegacyStorePrefs {
  if (!raw || typeof raw !== 'object') return {};
  const value = raw as LegacyStorePrefs;
  return {
    storeSlug: typeof value.storeSlug === 'string' ? value.storeSlug : undefined,
    storePolicies:
      value.storePolicies && typeof value.storePolicies === 'object'
        ? value.storePolicies
        : undefined,
    storeContact:
      value.storeContact && typeof value.storeContact === 'object'
        ? value.storeContact
        : undefined,
    storeHours:
      value.storeHours && typeof value.storeHours === 'object'
        ? normalizeStoreOpeningHours(value.storeHours)
        : undefined,
  };
}

export function readPrivacySettings(raw: unknown): PrivacySettings {
  if (!raw || typeof raw !== 'object') return {};
  const value = raw as PrivacySettings;
  return {
    showEmail: value.showEmail,
    showPhone: value.showPhone,
    showLocation: value.showLocation,
  };
}

export function buildStoreContactFromSettings(
  storeLocation: string | null | undefined,
  settings?: StoreContactSettings,
): StoreContactInfo | undefined {
  if (!settings) return undefined;

  const showAddress = settings.showAddress !== false;
  const parsed = parseStoreAddress(
    showAddress ? storeLocation : null,
    showAddress ? settings.addressLine : null,
  );

  const contact: StoreContactInfo = {
    city: parsed.city ?? undefined,
    addressLine: parsed.addressLine ?? undefined,
    phone: settings.showPhone ? settings.phone : undefined,
    email: settings.showEmail ? settings.email : undefined,
    website: settings.website ?? undefined,
  };

  const hasValue = Object.values(contact).some((value) => Boolean(value));
  return hasValue ? contact : undefined;
}

/** @deprecated Account-level prefs — use store row fields when available. */
export function buildLegacyStoreContact(input: {
  email: string;
  phone?: string | null;
  address?: string | null;
  location?: string | null;
  website?: string | null;
  isBusinessAccount?: boolean;
  privacy: PrivacySettings;
  prefs: LegacyStorePrefs;
}): StoreContactInfo | undefined {
  const showLocation = input.privacy.showLocation !== false;
  const showPhone =
    input.prefs.storeContact?.showPhone === true ||
    input.privacy.showPhone === true ||
    input.isBusinessAccount === true;
  const showEmail = input.prefs.storeContact?.showEmail === true || input.privacy.showEmail === true;

  const parsed = parseStoreAddress(
    showLocation ? input.location : null,
    showLocation ? input.address : null,
  );

  const phone = showPhone ? input.prefs.storeContact?.phone ?? input.phone ?? undefined : undefined;
  const email = showEmail ? input.prefs.storeContact?.email ?? input.email : undefined;
  const website = input.website ?? undefined;

  const contact: StoreContactInfo = {
    city: parsed.city ?? undefined,
    addressLine: parsed.addressLine ?? undefined,
    phone: phone ?? undefined,
    email: email ?? undefined,
    website: website ?? undefined,
  };

  const hasValue = Object.values(contact).some((value) => Boolean(value));
  return hasValue ? contact : undefined;
}

export function resolveStoreOpeningHoursFromRow(
  storeHours: unknown,
  legacyPrefs?: LegacyStorePrefs,
): StoreOpeningHours | undefined {
  return normalizeStoreOpeningHours(storeHours) ?? legacyPrefs?.storeHours;
}

export function resolveStorePoliciesFromRow(
  storePolicies: unknown,
  legacyPrefs?: LegacyStorePrefs,
  responseTimeFallback?: string,
): StorePolicy {
  const policies = parseStorePolicies(storePolicies);
  if (policies) {
    return {
      ...policies,
      responseTime: policies.responseTime ?? responseTimeFallback,
    };
  }
  return {
    returns: legacyPrefs?.storePolicies?.returns,
    shipping: legacyPrefs?.storePolicies?.shipping,
    responseTime: legacyPrefs?.storePolicies?.responseTime ?? responseTimeFallback,
  };
}

/** @deprecated Use buildLegacyStoreContact */
export const buildStoreContact = buildLegacyStoreContact;

/** @deprecated Use resolveStoreOpeningHoursFromRow */
export function resolveStoreOpeningHours(prefs: LegacyStorePrefs): StoreOpeningHours | undefined {
  return prefs.storeHours ?? undefined;
}

export type { LegacyStorePrefs as StorePrefs };
