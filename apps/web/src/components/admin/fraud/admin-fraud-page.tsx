'use client';

import { useCallback, useEffect, useState } from 'react';

import type {
  FraudRiskBreakdownItem,
  FraudSignal,
  HighRiskListingSummary,
  HighRiskUserSummary,
} from '@community-marketplace/types';
import { FRAUD_SIGNAL_LABELS, fraudRiskLevel } from '@community-marketplace/types';
import { formatListedAgo } from '@community-marketplace/utils';
import {
  Card,
  IconActionButton,
  IconActionGroup,
  TruncatedText,
} from '@community-marketplace/ui-dashboard';

import { AdminTableFooter } from '@/components/dashboard/admin-table-footer';
import { DashboardPageShell, DataTable } from '@/components/dashboard/async-resource';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { adminFraudService } from '@/services/admin-fraud.service';
import { adminSellerVerificationService } from '@/services/admin-seller-verification.service';
import { adminService, type AdminServiceRole } from '@/services/admin.service';

type FraudTab = 'users' | 'listings' | 'signals';

function RiskBadge({ score }: { score: number }) {
  const level = fraudRiskLevel(score);
  const styles = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-amber-100 text-amber-900',
    high: 'bg-orange-100 text-orange-900',
    critical: 'bg-red-100 text-red-900',
  } as const;

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[level]}`}>
      {score} — {level}
    </span>
  );
}

function BreakdownList({ items }: { items: FraudRiskBreakdownItem[] }) {
  if (!items.length) return <p className="text-sm text-gray-500">No active signals.</p>;
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li key={item.signalType} className="flex justify-between gap-4">
          <span className="text-gray-700">{item.label}</span>
          <span className="font-medium text-gray-900">
            {item.count}× ({item.totalScore} pts)
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AdminFraudPage({ role }: { role: AdminServiceRole }) {
  const [tab, setTab] = useState<FraudTab>('users');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<HighRiskUserSummary | null>(null);
  const [signals, setSignals] = useState<FraudSignal[]>([]);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchUsers = useCallback(
    (page: number, limit: number) =>
      adminFraudService.listHighRiskUsers(role, { page, limit, minRiskScore: 51 }),
    [role],
  );

  const fetchListings = useCallback(
    (page: number, limit: number) =>
      adminFraudService.listHighRiskListings(role, { page, limit, minRiskScore: 51 }),
    [role],
  );

  const fetchSignals = useCallback(
    (page: number, limit: number) => adminFraudService.listSignals(role, { page, limit }),
    [role],
  );

  const usersQuery = usePaginatedQuery({ fetcher: fetchUsers });
  const listingsQuery = usePaginatedQuery({ fetcher: fetchListings });
  const signalsQuery = usePaginatedQuery({ fetcher: fetchSignals });

  const activeQuery =
    tab === 'users' ? usersQuery : tab === 'listings' ? listingsQuery : signalsQuery;

  useEffect(() => {
    if (!selectedUserId) {
      setBreakdown(null);
      return;
    }
    void adminFraudService.getUserBreakdown(role, selectedUserId).then(setBreakdown);
    void adminFraudService
      .listSignals(role, { userId: selectedUserId, limit: 50 })
      .then((r) => setSignals(r.data));
  }, [selectedUserId, role]);

  async function runAction(action: () => Promise<unknown>) {
    setActing(true);
    setActionError(null);
    try {
      await action();
      await usersQuery.reload();
      await listingsQuery.reload();
      await signalsQuery.reload();
      if (selectedUserId) {
        setBreakdown(await adminFraudService.getUserBreakdown(role, selectedUserId));
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActing(false);
    }
  }

  const userRows = usersQuery.data.map((user: HighRiskUserSummary) => [
    user.displayName ?? user.email ?? user.userId.slice(0, 8),
    user.email ?? '—',
    user.sellerStatus ?? '—',
    <RiskBadge key={`risk-${user.userId}`} score={user.riskScore} />,
    user.signalCount,
    user.latestSignalAt ? formatListedAgo(user.latestSignalAt) : '—',
    <IconActionGroup key={`actions-${user.userId}`}>
      <IconActionButton icon="eye" label="Review" onClick={() => setSelectedUserId(user.userId)} />
    </IconActionGroup>,
  ]);

  const listingRows = listingsQuery.data.map((listing: HighRiskListingSummary) => [
    <TruncatedText key={`title-${listing.listingId}`} text={listing.title} />,
    listing.sellerName ?? listing.sellerId.slice(0, 8),
    listing.status,
    <RiskBadge key={`risk-${listing.listingId}`} score={listing.riskScore} />,
    listing.signalCount,
    <IconActionGroup key={`actions-${listing.listingId}`}>
      <IconActionButton
        icon="eye"
        label="Seller"
        onClick={() => setSelectedUserId(listing.sellerId)}
      />
    </IconActionGroup>,
  ]);

  const signalRows = signalsQuery.data.map((signal: FraudSignal) => [
    FRAUD_SIGNAL_LABELS[signal.signalType],
    <TruncatedText key={`val-${signal.id}`} text={signal.signalValue} />,
    signal.riskScore,
    signal.userId.slice(0, 8),
    signal.listingId?.slice(0, 8) ?? '—',
    formatListedAgo(signal.createdAt),
    signal.dismissedAt ? 'Dismissed' : signal.escalatedAt ? 'Escalated' : 'Active',
  ]);

  return (
    <DashboardPageShell
      title="Fraud detection"
      description="Review high-risk sellers, listings, and fraud signals."
      loading={activeQuery.loading}
      error={activeQuery.error}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { id: 'users' as const, label: 'High-risk sellers' },
            { id: 'listings' as const, label: 'High-risk listings' },
            { id: 'signals' as const, label: 'Fraud signals' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-3 py-1 text-sm ${
              tab === item.id
                ? 'bg-[hsl(var(--dashboard-accent))] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title={tab === 'users' ? 'High-risk sellers' : tab === 'listings' ? 'High-risk listings' : 'All signals'}>
          {tab === 'users' && (
            <>
              <DataTable
                columns={['Seller', 'Email', 'Status', 'Risk', 'Signals', 'Latest', '']}
                rows={userRows}
              />
              <AdminTableFooter
                page={usersQuery.page}
                totalPages={usersQuery.totalPages}
                total={usersQuery.meta?.total ?? 0}
                onPageChange={usersQuery.setPage}
              />
            </>
          )}
          {tab === 'listings' && (
            <>
              <DataTable
                columns={['Listing', 'Seller', 'Status', 'Risk', 'Signals', '']}
                rows={listingRows}
              />
              <AdminTableFooter
                page={listingsQuery.page}
                totalPages={listingsQuery.totalPages}
                total={listingsQuery.meta?.total ?? 0}
                onPageChange={listingsQuery.setPage}
              />
            </>
          )}
          {tab === 'signals' && (
            <>
              <DataTable
                columns={['Type', 'Value', 'Score', 'User', 'Listing', 'When', 'State']}
                rows={signalRows}
              />
              <AdminTableFooter
                page={signalsQuery.page}
                totalPages={signalsQuery.totalPages}
                total={signalsQuery.meta?.total ?? 0}
                onPageChange={signalsQuery.setPage}
              />
            </>
          )}
        </Card>

        <Card title={breakdown ? 'Risk breakdown & actions' : 'Select a seller'}>
          {!selectedUserId ? (
            <p className="text-sm text-gray-500">
              Select a high-risk seller to view signal breakdown and take action.
            </p>
          ) : !breakdown ? (
            <p className="text-sm text-gray-500">Loading breakdown…</p>
          ) : (
            <div className="space-y-4">
              {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-gray-900">
                  {breakdown.displayName ?? breakdown.email}
                </p>
                <RiskBadge score={breakdown.riskScore} />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-900">Signal breakdown</p>
                <BreakdownList items={breakdown.breakdown} />
              </div>

              {signals.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-900">Recent signals</p>
                  <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-gray-600">
                    {signals.slice(0, 10).map((s) => (
                      <li key={s.id}>
                        {FRAUD_SIGNAL_LABELS[s.signalType]}: {s.signalValue}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  disabled={acting}
                  onClick={() =>
                    void runAction(() =>
                      adminFraudService.markSafe(role, { userId: selectedUserId }),
                    )
                  }
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Mark safe
                </button>
                <button
                  type="button"
                  disabled={acting}
                  onClick={() =>
                    void runAction(() =>
                      adminFraudService.escalate(role, {
                        userId: selectedUserId,
                        notes: 'Escalated from fraud dashboard',
                      }),
                    )
                  }
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                >
                  Escalate
                </button>
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => {
                    const reason = window.prompt('Suspension reason:');
                    if (!reason?.trim()) return;
                    void runAction(() =>
                      adminSellerVerificationService.suspendSeller(role, {
                        userId: selectedUserId,
                        reason: reason.trim(),
                      }),
                    );
                  }}
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Suspend seller
                </button>
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => {
                    const reason = window.prompt('Re-verification reason:');
                    if (!reason?.trim()) return;
                    void runAction(() =>
                      adminSellerVerificationService.forceReverify(role, {
                        userId: selectedUserId,
                        reason: reason.trim(),
                      }),
                    );
                  }}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Force re-verify
                </button>
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => {
                    const listingId = window.prompt('Listing ID to remove:');
                    if (!listingId?.trim()) return;
                    const reason = window.prompt('Removal reason:') ?? 'Fraud removal';
                    void runAction(() =>
                      adminService.removeListing(role, listingId.trim(), reason),
                    );
                  }}
                  className="rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Remove listing
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardPageShell>
  );
}
