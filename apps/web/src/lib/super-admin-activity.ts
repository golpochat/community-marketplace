import type { SuperAdminActivityEvent } from '@community-marketplace/types';

export function formatActivityEventType(eventType: string): string {
  return eventType
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatActivitySource(source: SuperAdminActivityEvent['source']): string {
  return source === 'moderation' ? 'Moderation' : 'User lifecycle';
}

export function formatActivityDetail(event: SuperAdminActivityEvent): string {
  const parts: string[] = [];
  if (event.actorId) parts.push(`Actor ${event.actorId.slice(0, 8)}…`);
  if (event.targetUserId) parts.push(`Target ${event.targetUserId.slice(0, 8)}…`);
  if (event.userId) parts.push(`User ${event.userId.slice(0, 8)}…`);
  if (event.reportId) parts.push(`Report ${event.reportId.slice(0, 8)}…`);
  return parts.length > 0 ? parts.join(' · ') : '—';
}
