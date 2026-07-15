export const FAST_TRACK_APPLY_METADATA_KEY = 'applyOnSubmit';

export const FAST_TRACK_REQUEUE_METADATA_KEY = 'requeueGranted';
export const FAST_TRACK_REQUEUE_APPLIED_KEY = 'requeueApplied';

export function readFastTrackPurchaseMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return { ...(value as Record<string, unknown>) };
}
