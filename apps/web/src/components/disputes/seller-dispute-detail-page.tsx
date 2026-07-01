'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import type { MarketplaceDispute } from '@community-marketplace/types';
import { DISPUTE_REASON_LABELS } from '@community-marketplace/types';
import { Card } from '@community-marketplace/ui-dashboard';

import { DashboardPageShell } from '@/components/dashboard/async-resource';
import { DisputeRespondForm } from '@/components/disputes/dispute-respond-form';
import { DisputeStatusBadge } from '@/components/disputes/dispute-status-badge';
import { DisputeTimeline } from '@/components/disputes/dispute-timeline';
import { DocumentPreview } from '@/components/admin/seller-verification/document-preview';
import { disputesService } from '@/services/disputes.service';

const ACTIVE_STATUSES = new Set(['open', 'awaiting_evidence', 'under_review']);

export function SellerDisputeDetailPage({ disputeId }: { disputeId: string }) {
  const [dispute, setDispute] = useState<MarketplaceDispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDispute(await disputesService.getDetail(disputeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dispute');
    } finally {
      setLoading(false);
    }
  }, [disputeId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <DashboardPageShell title="Dispute" description="Loading…">
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading dispute…</p>
      </DashboardPageShell>
    );
  }

  if (error || !dispute) {
    return (
      <DashboardPageShell title="Dispute" description="Unable to load dispute.">
        <p className="text-sm text-destructive">{error ?? 'Dispute not found'}</p>
        <Link href="/seller/disputes" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Back to disputes
        </Link>
      </DashboardPageShell>
    );
  }

  const canRespond = ACTIVE_STATUSES.has(dispute.disputeStatus);

  return (
    <DashboardPageShell
      title={dispute.listing?.title ?? 'Dispute'}
      description="Review the buyer's claim and respond."
    >
      <div className="mb-4">
        <Link href="/seller/disputes" className="text-sm text-blue-600 hover:underline">
          All disputes
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Buyer claim">
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Status</dt>
                <dd className="mt-1">
                  <DisputeStatusBadge status={dispute.disputeStatus} />
                </dd>
              </div>
              <div>
                <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Reason</dt>
                <dd className="mt-1 text-[hsl(var(--dashboard-main-fg))]">{DISPUTE_REASON_LABELS[dispute.reason]}</dd>
              </div>
              <div>
                <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap text-[hsl(var(--dashboard-main-fg))]">{dispute.description}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Timeline">
            <DisputeTimeline events={dispute.timeline ?? []} />
          </Card>
        </div>

        <div className="space-y-6">
          {canRespond ? (
            <DisputeRespondForm disputeId={dispute.id} onSubmitted={() => void load()} />
          ) : null}

          {(dispute.evidence ?? []).length > 0 ? (
            <Card title="Evidence">
              <div className="space-y-3">
                {(dispute.evidence ?? []).map((item) => (
                  <DocumentPreview
                    key={item.id}
                    label={item.description ?? `Evidence (${item.uploaderRole})`}
                    url={item.fileUrl}
                  />
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </DashboardPageShell>
  );
}
