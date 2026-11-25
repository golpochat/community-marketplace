'use client';

import { useCallback, useEffect, useState } from 'react';

import type { PlatformPurchase, PlatformPurchaseStatus } from '@community-marketplace/types';
import { PLATFORM_PURCHASE_TYPES } from '@community-marketplace/types';
import { Button, useAppFeedback } from '@community-marketplace/ui';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

import { ReasonPromptDialog } from '@/components/shared/reason-prompt-dialog';
import { monetizationService } from '@/services/monetization.service';
import type { AdminServiceRole } from '@/services/admin.service';

interface AdminMonetizationPurchasesProps {
  role: AdminServiceRole;
}

const SKU_LABELS: Record<string, string> = {
  listing_boost: 'Listing boost',
  featured_slot: 'Featured listing',
  featured_store: 'Featured store',
  fast_track_verification: 'Fast-track verify',
  store_slot_2: 'Store slot 2',
  store_slot_3: 'Store slot 3',
  store_bundle_3: 'Store bundle',
  buyer_statement: 'Buyer statement',
  seller_growth_pack: 'Growth pack',
  ai_credit_2: 'AI credit €2',
  ai_credit_5: 'AI credit €5',
  ai_credit_10: 'AI credit €10',
  early_cashback_unlock: 'Early cashback unlock',
  priority_message: 'Priority message',
};

const STATUS_FILTERS: Array<PlatformPurchaseStatus | 'all'> = [
  'all',
  'succeeded',
  'refunded',
  'pending',
  'failed',
];

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  } catch {
    return `€${amount.toFixed(2)}`;
  }
}

export function AdminMonetizationPurchases({ role }: AdminMonetizationPurchasesProps) {
  const { success: feedbackSuccess, error: feedbackError } = useAppFeedback();
  const [rows, setRows] = useState<PlatformPurchase[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<PlatformPurchaseStatus | 'all'>('succeeded');
  const [type, setType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<PlatformPurchase | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await monetizationService.listPlatformPurchases(role, {
        page,
        limit: 20,
        status: status === 'all' ? undefined : status,
        type: type === 'all' ? undefined : (type as PlatformPurchase['type']),
      });
      setRows(result.data);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  }, [role, page, status, type]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRefund(reason: string) {
    if (!refundTarget) return;
    setRefundingId(refundTarget.id);
    try {
      await monetizationService.refundPlatformPurchase(role, refundTarget.id, reason);
      feedbackSuccess('SKU purchase refunded', 'Card/credits reversed and entitlements wound back where possible.');
      setRefundTarget(null);
      await load();
    } catch (err) {
      feedbackError(
        'Refund failed',
        err instanceof Error ? err.message : 'Could not refund this purchase',
      );
    } finally {
      setRefundingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <DashboardCard title="Platform SKU purchases">
        <p className="mb-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          Refund succeeded boosts, featured slots, AI packs, store slots, and other platform
          products. Listing GMV card refunds stay under Payments → Pending refunds.
        </p>

        <div className="mb-4 flex flex-wrap gap-3">
          <label className="text-sm">
            Status{' '}
            <select
              className="ml-1 rounded-md border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] px-2 py-1"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value as PlatformPurchaseStatus | 'all');
              }}
            >
              {STATUS_FILTERS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Type{' '}
            <select
              className="ml-1 rounded-md border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] px-2 py-1"
              value={type}
              onChange={(e) => {
                setPage(1);
                setType(e.target.value);
              }}
            >
              <option value="all">all</option>
              {PLATFORM_PURCHASE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {SKU_LABELS[value] ?? value}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No purchases found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-sidebar-muted))]">
                  <th className="py-2 pr-3 font-medium">When</th>
                  <th className="py-2 pr-3 font-medium">SKU</th>
                  <th className="py-2 pr-3 font-medium">User</th>
                  <th className="py-2 pr-3 font-medium">Amount</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[hsl(var(--dashboard-sidebar-border))]/60"
                  >
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString('en-IE')}
                    </td>
                    <td className="py-2 pr-3">{SKU_LABELS[row.type] ?? row.type}</td>
                    <td className="py-2 pr-3">{row.userEmail ?? row.userId.slice(0, 8)}</td>
                    <td className="py-2 pr-3">{formatMoney(row.amount, row.currency)}</td>
                    <td className="py-2 pr-3">{row.status}</td>
                    <td className="py-2">
                      {row.status === 'succeeded' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={refundingId === row.id}
                          onClick={() => setRefundTarget(row)}
                        >
                          {refundingId === row.id ? 'Refunding…' : 'Refund'}
                        </Button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-4 flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </DashboardCard>

      <ReasonPromptDialog
        open={Boolean(refundTarget)}
        onClose={() => setRefundTarget(null)}
        title="Refund SKU purchase"
        description={
          refundTarget
            ? `Refund ${SKU_LABELS[refundTarget.type] ?? refundTarget.type} (${formatMoney(refundTarget.amount, refundTarget.currency)}) for ${refundTarget.userEmail ?? refundTarget.userId}. Stripe card charge and wallet credits are reversed; time-based perks end now.`
            : undefined
        }
        confirmLabel="Refund purchase"
        onConfirm={(reason) => void handleRefund(reason)}
      />
    </div>
  );
}
