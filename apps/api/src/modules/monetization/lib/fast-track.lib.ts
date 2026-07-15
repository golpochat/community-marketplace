import { computeFastTrackReviewDueAt } from '@community-marketplace/types';

/** DB fields applied when a case enters the fast-track (priority) queue. */
export function buildPrioritySlaFields(activatedAt: Date, slaAnchorAt?: Date) {
  const anchor = slaAnchorAt ?? activatedAt;
  return {
    priority: true,
    priorityActivatedAt: activatedAt,
    slaDueAt: new Date(computeFastTrackReviewDueAt(anchor)),
    slaOverdueNotifiedAt: null as Date | null,
  };
}
