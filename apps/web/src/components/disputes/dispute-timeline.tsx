'use client';

import type { DisputeTimelineEvent } from '@community-marketplace/types';
import { formatListedAgo } from '@community-marketplace/utils';

import { DocumentPreview } from '@/components/admin/seller-verification/document-preview';

export function DisputeTimeline({ events }: { events: DisputeTimelineEvent[] }) {
  if (!events.length) {
    return (
      <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No activity yet.</p>
    );
  }

  return (
    <ol className="space-y-4">
      {events.map((event) => (
        <li key={event.id} className="relative border-l-2 border-[hsl(var(--dashboard-sidebar-border))] pl-4">
          <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-[hsl(var(--dashboard-accent))]" />
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">{event.label}</p>
            <span className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{formatListedAgo(event.createdAt)}</span>
          </div>
          {event.actorName ? (
            <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{event.actorName}</p>
          ) : null}
          {event.detail ? (
            <p className="mt-1 whitespace-pre-wrap text-sm text-[hsl(var(--dashboard-main-fg))]">{event.detail}</p>
          ) : null}
          {event.type === 'evidence' && typeof event.metadata?.fileUrl === 'string' ? (
            <div className="mt-2">
              <DocumentPreview label="Evidence" url={event.metadata.fileUrl} />
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
