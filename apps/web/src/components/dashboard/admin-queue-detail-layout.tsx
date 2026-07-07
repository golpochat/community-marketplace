'use client';

import type { ReactNode } from 'react';

import { Card } from '@community-marketplace/ui-dashboard';

import { EmptyState } from '@/components/EmptyState';
import { DashboardSectionTabs, type DashboardTabItem } from '@/components/dashboard/dashboard-section-tabs';

export interface AdminQueueDetailLayoutProps {
  tabs: DashboardTabItem[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  summary?: ReactNode;
  queueLoading?: boolean;
  queueTotal: number;
  queueEmptyTitle: string;
  queueEmptyDescription?: string;
  queueContent: ReactNode;
  queueFooter: ReactNode;
  showDetailPanel: boolean;
  detailTitle: string;
  detailEmptyMessage: string;
  detailLoading?: boolean;
  detailContent: ReactNode | null;
}

export function AdminQueueDetailLayout({
  tabs,
  activeTabId,
  onTabChange,
  summary,
  queueLoading = false,
  queueTotal,
  queueEmptyTitle,
  queueEmptyDescription,
  queueContent,
  queueFooter,
  showDetailPanel,
  detailTitle,
  detailEmptyMessage,
  detailLoading = false,
  detailContent,
}: AdminQueueDetailLayoutProps) {
  const showEmptyQueue = !queueLoading && queueTotal === 0;

  return (
    <div className="space-y-6">
      {summary ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{summary}</div> : null}

      <DashboardSectionTabs items={tabs} activeId={activeTabId} onChange={onTabChange} />

      <div
        className={
          showDetailPanel
            ? 'grid gap-6 xl:grid-cols-2'
            : 'grid gap-6'
        }
      >
        <Card title="Queue">
          {showEmptyQueue ? (
            <EmptyState
              variant="dashboard"
              title={queueEmptyTitle}
              description={queueEmptyDescription}
            />
          ) : (
            queueContent
          )}
          {!showEmptyQueue ? queueFooter : null}
        </Card>

        {showDetailPanel ? (
          <Card title={detailTitle}>
            {detailLoading ? (
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
            ) : detailContent ? (
              detailContent
            ) : (
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">{detailEmptyMessage}</p>
            )}
          </Card>
        ) : null}
      </div>
    </div>
  );
}
