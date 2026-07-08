'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import type {
  FraudRiskBreakdownItem,
  FraudSignal,
  FraudSignalListItem,
  FraudSignalStatus,
  HighRiskListingSummary,
  HighRiskUserSummary,
} from '@community-marketplace/types';
import { FRAUD_SIGNAL_LABELS, fraudRiskLevel, fraudSignalStatus } from '@community-marketplace/types';
import { formatListedAgo } from '@community-marketplace/utils';
import {
  Button,
  IconActionButton,
  IconActionGroup,
  TruncatedText,
} from '@community-marketplace/ui-dashboard';

import { FraudReasonDialog } from '@/components/admin/fraud/fraud-reason-dialog';
import { AdminTableFooter } from '@/components/dashboard/admin-table-footer';
import { AdminQueueDetailLayout } from '@/components/dashboard/admin-queue-detail-layout';
import { DashboardSectionTabs } from '@/components/dashboard/dashboard-section-tabs';
import { DashboardPageShell, DataTable } from '@/components/dashboard/async-resource';
import { StatCard } from '@/components/dashboard/stat-card';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { adminFraudService } from '@/services/admin-fraud.service';
import { adminSellerVerificationService } from '@/services/admin-seller-verification.service';
import { adminService, type AdminServiceRole } from '@/services/admin.service';

type FraudTab = 'users' | 'listings' | 'signals';
type SignalFilter = 'active' | 'all' | 'dismissed' | 'escalated';

type FraudDialogAction =
  | { kind: 'suspend'; userId: string }
  | { kind: 'reverify'; userId: string }
  | { kind: 'remove-listing'; listingId: string }
  | { kind: 'escalate'; userId: string; listingId?: string }
  | { kind: 'escalate-signal'; userId: string; listingId?: string }
  | null;

const FRAUD_USER_COLUMNS = ['Seller', 'Email', 'Status', 'Risk', 'Signals', 'Latest', ''] as const;
const FRAUD_USER_COLUMN_WIDTHS = ['18%', '26%', '12%', '16%', '8%', '14%', '48px'];
const FRAUD_USER_COLUMN_CLASSES = [
  'min-w-0',
  'min-w-0',
  'min-w-0',
  'min-w-0 whitespace-nowrap',
  'min-w-0',
  'min-w-0',
  'px-2',
] as const;

const FRAUD_LISTING_COLUMNS = ['Listing', 'Seller', 'Status', 'Risk', 'Signals', ''] as const;
const FRAUD_LISTING_COLUMN_WIDTHS = ['30%', '22%', '12%', '18%', '10%', '48px'];
const FRAUD_LISTING_COLUMN_CLASSES = [
  'min-w-0',
  'min-w-0',
  'min-w-0',
  'min-w-0 whitespace-nowrap',
  'min-w-0',
  'px-2',
] as const;

const FRAUD_SIGNAL_COLUMNS = ['Type', 'Subject', 'Risk', 'Detected', 'State', ''] as const;
const FRAUD_SIGNAL_COLUMN_WIDTHS = ['16%', '28%', '14%', '14%', '12%', '48px'];
const FRAUD_SIGNAL_COLUMN_CLASSES = [
  'min-w-0',
  'min-w-0',
  'min-w-0 whitespace-nowrap',
  'min-w-0',
  'min-w-0 whitespace-nowrap',
  'px-2',
] as const;

function QueueCellText({ text }: { text: string }) {
  return (
    <span className="block truncate" title={text}>
      {text}
    </span>
  );
}

const FRAUD_TABS = [
  { id: 'users', label: 'High-risk sellers' },
  { id: 'listings', label: 'High-risk listings' },
  { id: 'signals', label: 'Fraud signals' },
] as const;

const EMPTY_COPY: Record<
  FraudTab,
  { title: string; description: string; detailMessage: string; detailTitle: string }
> = {
  users: {
    title: 'No high-risk sellers',
    description: 'No sellers currently exceed the fraud risk threshold.',
    detailMessage: 'Select a seller from the queue to review signals and take action.',
    detailTitle: 'Seller review',
  },
  listings: {
    title: 'No high-risk listings',
    description: 'No listings currently exceed the fraud risk threshold.',
    detailMessage: 'Select a listing from the queue to review its risk breakdown.',
    detailTitle: 'Listing review',
  },
  signals: {
    title: 'No fraud signals',
    description: 'No fraud signals have been recorded in this view.',
    detailMessage: 'Select a signal from the queue to review details and respond.',
    detailTitle: 'Signal review',
  },
};

const SIGNAL_FILTER_TABS = [
  { id: 'active', label: 'Needs action' },
  { id: 'all', label: 'All' },
  { id: 'dismissed', label: 'Dismissed' },
  { id: 'escalated', label: 'Escalated' },
] as const;

const SIGNAL_EMPTY_COPY: Record<SignalFilter, { title: string; description: string }> = {
  active: {
    title: 'No signals need action',
    description: 'There are no open fraud signals waiting for review.',
  },
  all: {
    title: 'No fraud signals',
    description: 'No fraud signals match this view.',
  },
  dismissed: {
    title: 'No dismissed signals',
    description: 'No dismissed fraud signals in this view.',
  },
  escalated: {
    title: 'No escalated signals',
    description: 'No escalated fraud signals are waiting for follow-up.',
  },
};

function formatSubjectLabel(signal: FraudSignalListItem): string {
  if (signal.userLabel?.trim()) return signal.userLabel.trim();
  if (signal.userEmail) return signal.userEmail;
  return `User ${signal.userId.slice(0, 8)}`;
}

function SignalStatusBadge({ status }: { status: FraudSignalStatus }) {
  const className =
    status === 'active'
      ? 'bg-amber-50 text-amber-900'
      : status === 'escalated'
        ? 'bg-orange-50 text-orange-900'
        : 'bg-[hsl(var(--dashboard-sidebar-active)/0.5)] text-[hsl(var(--dashboard-sidebar-muted))]';

  const label = status === 'active' ? 'Active' : status === 'escalated' ? 'Escalated' : 'Dismissed';

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
function RiskBadge({ score }: { score: number }) {
  const level = fraudRiskLevel(score);
  const styles = {
    low: 'bg-[hsl(var(--dashboard-sidebar-active)/0.5)] text-[hsl(var(--dashboard-main-fg))]',
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
  if (!items.length) {
    return <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No active signals.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li key={item.signalType} className="flex justify-between gap-4">
          <span className="text-[hsl(var(--dashboard-main-fg))]">{item.label}</span>
          <span className="font-medium text-[hsl(var(--dashboard-main-fg))]">
            {item.count}× ({item.totalScore} pts)
          </span>
        </li>
      ))}
    </ul>
  );
}

function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-[hsl(var(--dashboard-sidebar-border))] pt-4">
      {children}
    </div>
  );
}

export function AdminFraudPage({ role }: { role: AdminServiceRole }) {
  const [tab, setTab] = useState<FraudTab>('users');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<HighRiskUserSummary | null>(null);
  const [userSignals, setUserSignals] = useState<FraudSignal[]>([]);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [dialogAction, setDialogAction] = useState<FraudDialogAction>(null);
  const [signalFilter, setSignalFilter] = useState<SignalFilter>('active');
  const [activeSignalsTotal, setActiveSignalsTotal] = useState(0);
  const [allSignalsTotal, setAllSignalsTotal] = useState(0);

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
    (page: number, limit: number) =>
      adminFraudService.listSignals(role, {
        page,
        limit,
        status: signalFilter,
      }),
    [role, signalFilter],
  );

  const usersQuery = usePaginatedQuery({ fetcher: fetchUsers });
  const listingsQuery = usePaginatedQuery({ fetcher: fetchListings });
  const signalsQuery = usePaginatedQuery({ fetcher: fetchSignals });

  const activeQuery =
    tab === 'users' ? usersQuery : tab === 'listings' ? listingsQuery : signalsQuery;

  const selectedListing = useMemo(
    () => listingsQuery.data.find((item) => item.listingId === selectedListingId) ?? null,
    [listingsQuery.data, selectedListingId],
  );

  const selectedSignal = useMemo(
    () => signalsQuery.data.find((item) => item.id === selectedSignalId) ?? null,
    [signalsQuery.data, selectedSignalId],
  );

  const refreshActiveSignalsTotal = useCallback(async () => {
    const [activeResult, allResult] = await Promise.all([
      adminFraudService.listSignals(role, { page: 1, limit: 1, status: 'active' }),
      adminFraudService.listSignals(role, { page: 1, limit: 1, status: 'all' }),
    ]);
    setActiveSignalsTotal(activeResult.meta?.total ?? 0);
    setAllSignalsTotal(allResult.meta?.total ?? 0);
  }, [role]);

  useEffect(() => {
    void refreshActiveSignalsTotal();
  }, [refreshActiveSignalsTotal]);

  useEffect(() => {
    if (tab !== 'users' || !selectedUserId) {
      setBreakdown(null);
      setUserSignals([]);
      return;
    }

    void adminFraudService.getUserBreakdown(role, selectedUserId).then(setBreakdown);
    void adminFraudService
      .listSignals(role, { userId: selectedUserId, limit: 50 })
      .then((result) => setUserSignals(result.data));
  }, [selectedUserId, role, tab]);

  function handleTabChange(nextTab: string) {
    const next = nextTab as FraudTab;
    setTab(next);
    setSelectedUserId(null);
    setSelectedListingId(null);
    setSelectedSignalId(null);
    setBreakdown(null);
    setUserSignals([]);
    setActionError(null);
    if (next === 'users') usersQuery.setPage(1);
    else if (next === 'listings') listingsQuery.setPage(1);
    else signalsQuery.setPage(1);
  }

  function handleSignalFilterChange(nextFilter: string) {
    setSignalFilter(nextFilter as SignalFilter);
    setSelectedSignalId(null);
    setActionError(null);
    signalsQuery.setPage(1);
  }

  async function reloadAll() {
    await Promise.all([usersQuery.reload(), listingsQuery.reload(), signalsQuery.reload()]);
    await refreshActiveSignalsTotal();
    if (tab === 'users' && selectedUserId) {
      setBreakdown(await adminFraudService.getUserBreakdown(role, selectedUserId));
      const result = await adminFraudService.listSignals(role, {
        userId: selectedUserId,
        limit: 50,
      });
      setUserSignals(result.data);
    }
  }

  async function runAction(action: () => Promise<unknown>) {
    setActing(true);
    setActionError(null);
    try {
      await action();
      await reloadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActing(false);
    }
  }

  async function handleDialogConfirm(reason: string) {
    if (!dialogAction) return;

    setActing(true);
    setActionError(null);

    try {
      if (dialogAction.kind === 'suspend') {
        await adminSellerVerificationService.suspendSeller(role, {
          userId: dialogAction.userId,
          reason,
        });
      } else if (dialogAction.kind === 'reverify') {
        await adminSellerVerificationService.forceReverify(role, {
          userId: dialogAction.userId,
          reason,
        });
      } else if (dialogAction.kind === 'remove-listing') {
        await adminService.removeListing(role, dialogAction.listingId, reason);
      } else if (dialogAction.kind === 'escalate' || dialogAction.kind === 'escalate-signal') {
        await adminFraudService.escalate(role, {
          userId: dialogAction.userId,
          listingId: dialogAction.listingId,
          notes: reason || 'Escalated from fraud dashboard',
        });
      }
      setDialogAction(null);
      await reloadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActing(false);
    }
  }

  const userRows = usersQuery.data.map((user: HighRiskUserSummary) => [
    <QueueCellText
      key={`seller-${user.userId}`}
      text={user.displayName ?? user.email ?? user.userId.slice(0, 8)}
    />,
    <QueueCellText key={`email-${user.userId}`} text={user.email ?? '—'} />,
    <QueueCellText key={`status-${user.userId}`} text={user.sellerStatus ?? '—'} />,
    <RiskBadge key={`risk-${user.userId}`} score={user.riskScore} />,
    user.signalCount,
    <QueueCellText
      key={`latest-${user.userId}`}
      text={user.latestSignalAt ? formatListedAgo(user.latestSignalAt) : '—'}
    />,
    <IconActionGroup key={`actions-${user.userId}`}>
      <IconActionButton icon="eye" label="Review" onClick={() => setSelectedUserId(user.userId)} />
    </IconActionGroup>,
  ]);

  const listingRows = listingsQuery.data.map((listing: HighRiskListingSummary) => [
    <TruncatedText key={`title-${listing.listingId}`} text={listing.title} className="max-w-full" />,
    <QueueCellText
      key={`seller-${listing.listingId}`}
      text={listing.sellerName ?? listing.sellerId.slice(0, 8)}
    />,
    <QueueCellText key={`status-${listing.listingId}`} text={listing.status} />,
    <RiskBadge key={`risk-${listing.listingId}`} score={listing.riskScore} />,
    listing.signalCount,
    <IconActionGroup key={`actions-${listing.listingId}`}>
      <IconActionButton
        icon="eye"
        label="Review"
        onClick={() => setSelectedListingId(listing.listingId)}
      />
    </IconActionGroup>,
  ]);

  const signalRows = signalsQuery.data.map((signal: FraudSignalListItem) => [
    <QueueCellText key={`type-${signal.id}`} text={FRAUD_SIGNAL_LABELS[signal.signalType]} />,
    <div key={`subject-${signal.id}`} className="min-w-0 overflow-hidden">
      <p className="truncate font-medium text-[hsl(var(--dashboard-main-fg))]" title={formatSubjectLabel(signal)}>
        {formatSubjectLabel(signal)}
      </p>
      {signal.listingTitle ? (
        <p
          className="truncate text-xs text-[hsl(var(--dashboard-sidebar-muted))]"
          title={signal.listingTitle}
        >
          {signal.listingTitle}
        </p>
      ) : null}
    </div>,
    <RiskBadge key={`risk-${signal.id}`} score={signal.riskScore} />,
    <QueueCellText key={`detected-${signal.id}`} text={formatListedAgo(signal.createdAt)} />,
    <SignalStatusBadge key={`state-${signal.id}`} status={fraudSignalStatus(signal)} />,
    <IconActionGroup key={`actions-${signal.id}`}>
      <IconActionButton icon="eye" label="Review" onClick={() => setSelectedSignalId(signal.id)} />
    </IconActionGroup>,
  ]);

  const signalEmptyCopy = SIGNAL_EMPTY_COPY[signalFilter];
  const emptyCopy = tab === 'signals' ? { ...EMPTY_COPY.signals, ...signalEmptyCopy } : EMPTY_COPY[tab];
  const queueTotal = activeQuery.meta?.total ?? 0;
  const showDetailPanel = queueTotal > 0;

  const userDetail =
    tab === 'users' && selectedUserId && breakdown ? (
      <div className="space-y-4">
        {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">
            {breakdown.displayName ?? breakdown.email}
          </p>
          <RiskBadge score={breakdown.riskScore} />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">Signal breakdown</p>
          <BreakdownList items={breakdown.breakdown} />
        </div>

        {userSignals.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">Recent signals</p>
            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              {userSignals.slice(0, 10).map((signal) => (
                <li key={signal.id}>
                  {FRAUD_SIGNAL_LABELS[signal.signalType]}: {signal.signalValue}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <ActionBar>
          <Button
            variant="secondary"
            size="sm"
            disabled={acting}
            onClick={() =>
              void runAction(() => adminFraudService.markSafe(role, { userId: selectedUserId }))
            }
          >
            Mark safe
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={acting}
            onClick={() => setDialogAction({ kind: 'escalate', userId: selectedUserId })}
          >
            Escalate
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={acting}
            onClick={() => setDialogAction({ kind: 'suspend', userId: selectedUserId })}
          >
            Suspend seller
          </Button>
          <Button
            variant="default"
            size="sm"
            disabled={acting}
            onClick={() => setDialogAction({ kind: 'reverify', userId: selectedUserId })}
          >
            Force re-verify
          </Button>
        </ActionBar>
      </div>
    ) : null;

  const listingDetail =
    tab === 'listings' && selectedListing ? (
      <div className="space-y-4">
        {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
        <div className="space-y-1">
          <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">{selectedListing.title}</p>
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Seller: {selectedListing.sellerName ?? selectedListing.sellerId}
          </p>
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Status: {selectedListing.status}
          </p>
          <RiskBadge score={selectedListing.riskScore} />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">Signal breakdown</p>
          <BreakdownList items={selectedListing.breakdown} />
        </div>

        <ActionBar>
          <Button
            variant="secondary"
            size="sm"
            disabled={acting}
            onClick={() =>
              void runAction(() =>
                adminFraudService.markSafe(role, {
                  userId: selectedListing.sellerId,
                  listingId: selectedListing.listingId,
                }),
              )
            }
          >
            Mark listing safe
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={acting}
            onClick={() =>
              setDialogAction({
                kind: 'escalate',
                userId: selectedListing.sellerId,
                listingId: selectedListing.listingId,
              })
            }
          >
            Escalate
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={acting}
            onClick={() =>
              setDialogAction({ kind: 'remove-listing', listingId: selectedListing.listingId })
            }
          >
            Remove listing
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={acting}
            onClick={() => {
              setTab('users');
              setSelectedListingId(null);
              setSelectedUserId(selectedListing.sellerId);
            }}
          >
            Review seller
          </Button>
        </ActionBar>
      </div>
    ) : null;

  const signalDetail =
    tab === 'signals' && selectedSignal ? (
      <div className="space-y-4">
        {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

        <div className="flex flex-wrap items-center gap-2">
          <SignalStatusBadge status={fraudSignalStatus(selectedSignal)} />
          <RiskBadge score={selectedSignal.riskScore} />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
            {formatSubjectLabel(selectedSignal)}
          </p>
          {selectedSignal.userEmail && selectedSignal.userLabel ? (
            <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">{selectedSignal.userEmail}</p>
          ) : null}
        </div>

        <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.2)] px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
            Signal detail
          </p>
          <p className="mt-1 text-sm text-[hsl(var(--dashboard-main-fg))]">{selectedSignal.signalValue}</p>
        </div>

        {selectedSignal.listingTitle ? (
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Related listing:{' '}
            <span className="font-medium text-[hsl(var(--dashboard-main-fg))]">{selectedSignal.listingTitle}</span>
          </p>
        ) : null}

        {selectedSignal.dismissedAt ? (
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Dismissed {formatListedAgo(selectedSignal.dismissedAt)}. This record is closed.
          </p>
        ) : selectedSignal.escalatedAt ? (
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Escalated {formatListedAgo(selectedSignal.escalatedAt)}. Follow up from the seller or disputes queue.
          </p>
        ) : (
          <ActionBar>
            <Button
              variant="secondary"
              size="sm"
              disabled={acting}
              onClick={() =>
                void runAction(() =>
                  adminFraudService.markSafe(role, {
                    userId: selectedSignal.userId,
                    listingId: selectedSignal.listingId,
                    signalIds: [selectedSignal.id],
                  }),
                )
              }
            >
              Dismiss signal
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={acting}
              onClick={() =>
                setDialogAction({
                  kind: 'escalate-signal',
                  userId: selectedSignal.userId,
                  listingId: selectedSignal.listingId,
                })
              }
            >
              Escalate
            </Button>
            {selectedSignal.listingId ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={acting}
                onClick={() => {
                  setTab('listings');
                  setSelectedSignalId(null);
                  setSelectedListingId(selectedSignal.listingId!);
                }}
              >
                Review listing
              </Button>
            ) : null}
            <Button
              variant="secondary"
              size="sm"
              disabled={acting}
              onClick={() => {
                setTab('users');
                setSelectedSignalId(null);
                setSelectedUserId(selectedSignal.userId);
              }}
            >
              Review seller
            </Button>
          </ActionBar>
        )}
      </div>
    ) : null;

  const detailContent = userDetail ?? listingDetail ?? signalDetail;
  const detailTitle =
    tab === 'users' && breakdown
      ? 'Seller review'
      : tab === 'listings' && selectedListing
        ? 'Listing review'
        : tab === 'signals' && selectedSignal
          ? 'Signal review'
          : emptyCopy.detailTitle;

  const dialogCopy =
    dialogAction?.kind === 'suspend'
      ? {
          title: 'Suspend seller',
          description: 'The seller will lose access until reactivated.',
          confirmLabel: 'Suspend',
          variant: 'destructive' as const,
        }
      : dialogAction?.kind === 'reverify'
        ? {
            title: 'Force re-verification',
            description: 'The seller must complete verification again before selling.',
            confirmLabel: 'Force re-verify',
            variant: 'default' as const,
          }
        : dialogAction?.kind === 'remove-listing'
          ? {
              title: 'Remove listing',
              description: 'This listing will be removed from the marketplace.',
              confirmLabel: 'Remove listing',
              variant: 'destructive' as const,
            }
          : {
              title: 'Escalate for review',
              description: 'Add notes for the trust & safety escalation queue.',
              confirmLabel: 'Escalate',
              variant: 'default' as const,
            };

  return (
    <DashboardPageShell
      title="Fraud detection"
      description="Review high-risk sellers, listings, and fraud signals."
      loading={activeQuery.loading}
      error={activeQuery.error}
    >
      <AdminQueueDetailLayout
        tabs={[...FRAUD_TABS]}
        activeTabId={tab}
        onTabChange={handleTabChange}
        summary={
          <>
            <StatCard
              label="High-risk sellers"
              value={String(usersQuery.meta?.total ?? 0)}
            />
            <StatCard
              label="High-risk listings"
              value={String(listingsQuery.meta?.total ?? 0)}
            />
            <StatCard
              label={tab === 'signals' ? 'In this filter' : 'Fraud signals'}
              value={String(tab === 'signals' ? queueTotal : allSignalsTotal)}
            />
            <StatCard label="Needs action" value={String(activeSignalsTotal)} />
          </>
        }
        queueLoading={activeQuery.loading}
        queueTotal={queueTotal}
        queueEmptyTitle={emptyCopy.title}
        queueEmptyDescription={emptyCopy.description}
        queueContent={
          tab === 'users' ? (
            <DataTable
              columns={[...FRAUD_USER_COLUMNS]}
              rows={userRows}
              columnWidths={[...FRAUD_USER_COLUMN_WIDTHS]}
              columnClassNames={[...FRAUD_USER_COLUMN_CLASSES]}
            />
          ) : tab === 'listings' ? (
            <DataTable
              columns={[...FRAUD_LISTING_COLUMNS]}
              rows={listingRows}
              columnWidths={[...FRAUD_LISTING_COLUMN_WIDTHS]}
              columnClassNames={[...FRAUD_LISTING_COLUMN_CLASSES]}
            />
          ) : (
            <div className="space-y-4">
              <DashboardSectionTabs
                items={[...SIGNAL_FILTER_TABS]}
                activeId={signalFilter}
                onChange={handleSignalFilterChange}
                variant="nested"
              />
              <DataTable
                columns={[...FRAUD_SIGNAL_COLUMNS]}
                rows={signalRows}
                columnWidths={[...FRAUD_SIGNAL_COLUMN_WIDTHS]}
                columnClassNames={[...FRAUD_SIGNAL_COLUMN_CLASSES]}
              />
            </div>
          )
        }
        queueFooter={
          <AdminTableFooter
            page={activeQuery.page}
            totalPages={activeQuery.totalPages}
            total={queueTotal}
            onPageChange={activeQuery.setPage}
          />
        }
        showDetailPanel={showDetailPanel}
        detailTitle={detailTitle}
        detailEmptyMessage={emptyCopy.detailMessage}
        detailLoading={tab === 'users' && !!selectedUserId && !breakdown}
        detailContent={detailContent}
      />

      <FraudReasonDialog
        open={dialogAction !== null}
        title={dialogCopy.title}
        description={dialogCopy.description}
        confirmLabel={dialogCopy.confirmLabel}
        variant={dialogCopy.variant}
        loading={acting}
        required={
          dialogAction?.kind !== 'escalate' && dialogAction?.kind !== 'escalate-signal'
        }
        onClose={() => setDialogAction(null)}
        onConfirm={(reason) => void handleDialogConfirm(reason)}
      />
    </DashboardPageShell>
  );
}
