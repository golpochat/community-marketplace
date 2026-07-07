import type { SuperAdminActivityEvent } from '@community-marketplace/types';
import {
  formatAuditActivityDetail,
  formatAuditEventLabel,
} from '@community-marketplace/utils';

export function formatActivityEventType(event: SuperAdminActivityEvent | string): string {
  if (typeof event === 'string') {
    return formatAuditEventLabel(event, 'user');
  }
  return event.eventLabel || formatAuditEventLabel(event.eventType, event.source);
}

export function formatActivitySource(source: SuperAdminActivityEvent['source']): string {
  return source === 'moderation' ? 'Moderation' : 'User lifecycle';
}

export function formatActivityDetail(event: SuperAdminActivityEvent): string {
  if (event.detail) return event.detail;

  return formatAuditActivityDetail({
    eventType: event.eventType,
    source: event.source,
    actorLabel: event.actorLabel,
    targetLabel: event.targetLabel,
    subjectLabel: event.subjectLabel,
    metadata: event.metadata,
  });
}
