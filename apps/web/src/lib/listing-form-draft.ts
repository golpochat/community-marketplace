/** Browser draft for create-listing wizards (images are not persisted). */

export const GENERIC_LISTING_DRAFT_KEY = 'cm-listing-create-draft';
export const VEHICLE_LISTING_DRAFT_KEY = 'cm-vehicle-listing-create-draft';

const DRAFT_VERSION = 1 as const;

type DraftEnvelope<T> = {
  version: typeof DRAFT_VERSION;
  step: number;
  highestCompletedStep: number;
  data: T;
  savedAt: string;
};

function readDraft<T>(key: string): DraftEnvelope<T> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftEnvelope<T>;
    if (parsed?.version !== DRAFT_VERSION || typeof parsed.step !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeDraft<T>(
  key: string,
  payload: Omit<DraftEnvelope<T>, 'version' | 'savedAt'>,
): void {
  if (typeof window === 'undefined') return;
  try {
    const envelope: DraftEnvelope<T> = {
      version: DRAFT_VERSION,
      ...payload,
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Quota or private mode — ignore
  }
}

function clearDraft(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function loadGenericListingDraft<T>(): DraftEnvelope<T> | null {
  return readDraft<T>(GENERIC_LISTING_DRAFT_KEY);
}

export function saveGenericListingDraft<T>(payload: {
  step: number;
  highestCompletedStep: number;
  data: T;
}): void {
  writeDraft(GENERIC_LISTING_DRAFT_KEY, payload);
}

export function clearGenericListingDraft(): void {
  clearDraft(GENERIC_LISTING_DRAFT_KEY);
}

export function loadVehicleListingDraft<T>(): DraftEnvelope<T> | null {
  return readDraft<T>(VEHICLE_LISTING_DRAFT_KEY);
}

export function saveVehicleListingDraft<T>(payload: {
  step: number;
  highestCompletedStep: number;
  data: T;
}): void {
  writeDraft(VEHICLE_LISTING_DRAFT_KEY, payload);
}

export function clearVehicleListingDraft(): void {
  clearDraft(VEHICLE_LISTING_DRAFT_KEY);
}
