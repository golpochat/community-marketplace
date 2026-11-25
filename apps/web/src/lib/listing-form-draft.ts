/** Browser draft for create-listing wizards (images are not persisted). */

export const GENERIC_LISTING_DRAFT_KEY = 'cm-listing-create-draft';
export const VEHICLE_LISTING_DRAFT_KEY = 'cm-vehicle-listing-create-draft';

/** v1 = form fields only; v2 = form fields + AI previews (paid output). */
const DRAFT_VERSION = 2 as const;
const SUPPORTED_DRAFT_VERSIONS = new Set([1, 2]);

export type ListingAiPreviewMap = Partial<Record<string, string>>;

export type DraftEnvelope<T> = {
  version: number;
  step: number;
  highestCompletedStep: number;
  data: T;
  /** Last AI outputs by task — survives refresh so spent credits keep their text. */
  aiPreviews?: ListingAiPreviewMap;
  savedAt: string;
};

export type SaveListingDraftPayload<T> = {
  step: number;
  highestCompletedStep: number;
  data: T;
  aiPreviews?: ListingAiPreviewMap;
};

function readDraft<T>(key: string): DraftEnvelope<T> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftEnvelope<T>;
    if (
      !SUPPORTED_DRAFT_VERSIONS.has(parsed?.version) ||
      typeof parsed.step !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeDraft<T>(key: string, payload: SaveListingDraftPayload<T>): void {
  if (typeof window === 'undefined') return;
  try {
    const envelope: DraftEnvelope<T> = {
      version: DRAFT_VERSION,
      step: payload.step,
      highestCompletedStep: payload.highestCompletedStep,
      data: payload.data,
      ...(payload.aiPreviews && Object.keys(payload.aiPreviews).length > 0
        ? { aiPreviews: payload.aiPreviews }
        : {}),
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

export function saveGenericListingDraft<T>(payload: SaveListingDraftPayload<T>): void {
  writeDraft(GENERIC_LISTING_DRAFT_KEY, payload);
}

export function clearGenericListingDraft(): void {
  clearDraft(GENERIC_LISTING_DRAFT_KEY);
}

export function loadVehicleListingDraft<T>(): DraftEnvelope<T> | null {
  return readDraft<T>(VEHICLE_LISTING_DRAFT_KEY);
}

export function saveVehicleListingDraft<T>(payload: SaveListingDraftPayload<T>): void {
  writeDraft(VEHICLE_LISTING_DRAFT_KEY, payload);
}

export function clearVehicleListingDraft(): void {
  clearDraft(VEHICLE_LISTING_DRAFT_KEY);
}

/** Normalize stored preview map (drop empty strings). */
export function sanitizeAiPreviews(
  value: unknown,
): ListingAiPreviewMap | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const out: ListingAiPreviewMap = {};
  for (const [task, text] of Object.entries(value as Record<string, unknown>)) {
    if (typeof text === 'string' && text.trim()) {
      out[task] = text;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
