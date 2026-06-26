import type {
  StoreContactInfo,
  StoreDayHours,
  StoreOpeningHours,
  StoreWeekday,
} from '@community-marketplace/types';
import { parseStoreAddress } from '@community-marketplace/utils';

type StorePrefs = {
  storeSlug?: string;
  storePolicies?: {
    returns?: string;
    shipping?: string;
    responseTime?: string;
  };
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

export function readStorePrefs(raw: unknown): StorePrefs {
  if (!raw || typeof raw !== 'object') return {};
  const value = raw as StorePrefs;
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
        ? normalizeStoreHours(value.storeHours)
        : undefined,
  };
}

function normalizeStoreHours(raw: StoreOpeningHours): StoreOpeningHours | undefined {
  if (!raw.schedule || typeof raw.schedule !== 'object') return undefined;
  const schedule: Partial<Record<StoreWeekday, StoreDayHours>> = {};
  for (const day of STORE_WEEKDAYS) {
    const entry = raw.schedule[day];
    if (!entry || typeof entry !== 'object') continue;
    schedule[day] = {
      closed: Boolean(entry.closed),
      open: typeof entry.open === 'string' ? entry.open : undefined,
      close: typeof entry.close === 'string' ? entry.close : undefined,
    };
  }
  if (Object.keys(schedule).length === 0) return undefined;
  return {
    timezone: typeof raw.timezone === 'string' ? raw.timezone : undefined,
    note: typeof raw.note === 'string' ? raw.note : undefined,
    schedule,
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

export function buildStoreContact(input: {
  email: string;
  phone?: string | null;
  address?: string | null;
  location?: string | null;
  website?: string | null;
  isBusinessAccount?: boolean;
  privacy: PrivacySettings;
  prefs: StorePrefs;
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

export function resolveStoreOpeningHours(prefs: StorePrefs): StoreOpeningHours | undefined {
  return prefs.storeHours ?? undefined;
}

export type { StorePrefs };
