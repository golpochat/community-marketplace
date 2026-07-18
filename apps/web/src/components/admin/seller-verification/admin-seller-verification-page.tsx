'use client';

import { useCallback, useMemo, useState } from 'react';

import type {
  AdminSellerVerificationDetail,
  AdminSellerVerificationRow,
  AdminSellerVerificationTrackFilter,
  AdminSellerVerificationView,
} from '@community-marketplace/types';
import { formatFastTrackSlaLabel, PERMISSIONS } from '@community-marketplace/types';
import { formatDateTime } from '@community-marketplace/utils';
import {
  Card,
  IconActionButton,
  IconActionGroup,
  Tooltip,
} from '@community-marketplace/ui-dashboard';

import { useAppFeedback } from '@community-marketplace/ui';
import { DashboardFilteredEmptyState } from '@/components/dashboard/dashboard-filtered-empty-state';
import { ConfirmDialog } from '@/components/admin/seller-verification/confirm-dialog';
import { ForceReverifyModal } from '@/components/admin/seller-verification/force-reverify-modal';
import { ReactivateSellerModal } from '@/components/admin/seller-verification/reactivate-seller-modal';
import { RejectVerificationModal } from '@/components/admin/seller-verification/reject-verification-modal';
import { SellerStatusBadge } from '@/components/admin/seller-verification/seller-status-badge';
import { SetListingLimitModal } from '@/components/admin/seller-verification/set-listing-limit-modal';
import { StatusHistoryModal } from '@/components/admin/seller-verification/status-history-modal';
import { SuspendSellerModal } from '@/components/admin/seller-verification/suspend-seller-modal';
import { VerificationReviewModal } from '@/components/admin/seller-verification/verification-review-modal';
import { AdminTableFooter } from '@/components/dashboard/admin-table-footer';
import { DashboardPageShell, DataTable } from '@/components/dashboard/async-resource';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { usePermissions } from '@/hooks/use-permissions';
import {
  canManageSellerLimits,
  canReactivateSeller,
  canForceReverifySeller,
  canReviewSellerVerification,
  canSuspendSeller,
  canViewSellerDocuments,
} from '@/lib/admin-sidebar';
import {
  ADMIN_SELLER_VERIFICATION_VIEW_LABELS,
} from '@/lib/admin-seller-verification-routes';
import {
  adminSellerVerificationService,
  type AdminServiceRole,
} from '@/services/admin-seller-verification.service';

function TruncatedTableCell({ text }: { text: string }) {
  if (!text || text === '—') {
    return <span>{text || '—'}</span>;
  }

  return (
    <Tooltip label={text}>
      <span className="block max-w-[14rem] truncate">{text}</span>
    </Tooltip>
  );
}

export function AdminSellerVerificationPage({
  role,
  view,
}: {
  role: AdminServiceRole;
  view: AdminSellerVerificationView;
}) {
  const { permissions, role: userRole, loading: permissionsLoading, can } = usePermissions();
  const feedback = useAppFeedback();

  const activeView = view;
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [trackFilter, setTrackFilter] = useState<AdminSellerVerificationTrackFilter>('all');

  const [reviewRequestId, setReviewRequestId] = useState<string | undefined>();
  const [reviewUserId, setReviewUserId] = useState<string | undefined>();
  const [reviewSellerName, setReviewSellerName] = useState<string | undefined>();

  const [approveRequestId, setApproveRequestId] = useState<string | null>(null);
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [rejectSellerName, setRejectSellerName] = useState('');
  const [rejectIsFastTrack, setRejectIsFastTrack] = useState(false);

  const [suspendDetail, setSuspendDetail] = useState<AdminSellerVerificationDetail | null>(null);
  const [reactivateDetail, setReactivateDetail] = useState<AdminSellerVerificationDetail | null>(null);
  const [forceReverifyDetail, setForceReverifyDetail] = useState<AdminSellerVerificationDetail | null>(null);
  const [limitDetail, setLimitDetail] = useState<AdminSellerVerificationDetail | null>(null);
  const [historyUserId, setHistoryUserId] = useState<string | null>(null);
  const [historySellerName, setHistorySellerName] = useState<string | undefined>();

  const [acting, setActing] = useState(false);

  const canReview = canReviewSellerVerification(userRole, permissions);
  const canViewDocs = canViewSellerDocuments(userRole, permissions);
  const canSuspend = canSuspendSeller(userRole, permissions);
  const canReactivate = canReactivateSeller(userRole, permissions);
  const canForceReverify = canForceReverifySeller(userRole, permissions);
  const canManageLimits = canManageSellerLimits(userRole, permissions);

  const fetchRows = useCallback(
    (page: number, limit: number) =>
      adminSellerVerificationService.list(role, {
        page,
        limit,
        view: activeView,
        search: search.trim() || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        ...(activeView === 'pending' && trackFilter !== 'all' ? { track: trackFilter } : {}),
      }),
    [role, activeView, search, fromDate, toDate, trackFilter],
  );

  const { page, setPage, data, meta, loading, error, totalPages, reload } =
    usePaginatedQuery({ fetcher: fetchRows, limit: pageSize });

  async function handleReverify(item: AdminSellerVerificationRow) {
    setForceReverifyDetail({
      userId: item.userId,
      email: item.email,
      sellerName: item.sellerName,
      sellerStatus: item.sellerStatus,
      unverifiedListingCount: item.unverifiedListingCount,
      sellerLimit: item.sellerLimit,
      totalListings: item.totalListings,
      joinedAt: item.joinedAt,
      previousAttempts: [],
    });
  }

  const handleReverifyStable = useCallback(
    (item: AdminSellerVerificationRow) => void handleReverify(item),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable enough for table actions
    [role, reload],
  );

  const rows = useMemo(() => {
    return data.map((item) => {
      const statusBadge =
        item.requestStatus && activeView === 'pending'
          ? item.requestStatus
          : item.sellerStatus;

      return [
        <div key={`${item.userId}-name`} className="min-w-0">
          <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">{item.sellerName ?? '—'}</p>
          <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{item.email}</p>
          {item.priority && (
            <span className="mt-1 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-900">
              Priority
            </span>
          )}
        </div>,
        item.submittedAt ? formatDateTime(item.submittedAt) : '—',
        <SellerStatusBadge key={`${item.userId}-status`} status={statusBadge} />,
        activeView === 'approved' && item.verificationCompletedAt
          ? formatDateTime(item.verificationCompletedAt)
          : activeView === 'rejected'
            ? (
                <TruncatedTableCell key={`${item.userId}-reason`} text={item.rejectionReason ?? '—'} />
              )
            : activeView === 'pending'
              ? (
                  <div key={`${item.userId}-track`} className="space-y-0.5 text-xs">
                    <span
                      className={
                        item.priority
                          ? 'inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-medium text-indigo-900'
                          : 'text-[hsl(var(--dashboard-sidebar-muted))]'
                      }
                    >
                      {item.priority ? 'Fast-track' : 'Standard'}
                    </span>
                    {item.priority && item.reviewDueAt ? (
                      <p
                        className={
                          new Date(item.reviewDueAt) < new Date()
                            ? 'font-medium text-destructive'
                            : 'text-[hsl(var(--dashboard-sidebar-muted))]'
                        }
                      >
                        {formatFastTrackSlaLabel(item.reviewDueAt)}
                      </p>
                    ) : null}
                  </div>
                )
              : '—',
        <div key={`${item.userId}-actions`} className="flex flex-wrap gap-2">
          <IconActionGroup>
            <IconActionButton
              icon="eye"
              label={
                canReview &&
                item.requestId &&
                item.requestStatus === 'pending' &&
                item.sellerStatus !== 'verified'
                  ? 'Review documents'
                  : 'View'
              }
              onClick={() => {
                setReviewRequestId(item.requestId);
                setReviewUserId(item.userId);
                setReviewSellerName(item.sellerName);
                setRejectIsFastTrack(Boolean(item.priority));
              }}
            />
            {canForceReverify && activeView === 'rejected' ? (
              <IconActionButton
                icon="pencil"
                label="Force re-verification"
                onClick={() => void handleReverifyStable(item)}
              />
            ) : null}
          </IconActionGroup>
        </div>,
      ];
    });
  }, [data, activeView, canReview, canForceReverify, handleReverifyStable]);

  async function handleApproveConfirm() {
    if (!approveRequestId) return;
    setActing(true);
    try {
      await adminSellerVerificationService.approve(role, approveRequestId);
      feedback.success('Seller verified', 'The seller can now list and receive payouts.');
      setApproveRequestId(null);
      setReviewRequestId(undefined);
      setReviewUserId(undefined);
      await reload();
    } catch (err) {
      feedback.error(
        'Failed to approve verification',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setActing(false);
    }
  }

  async function handleRejectSubmit(
    reason: string,
    _requestAdditionalDocs: boolean,
    targetStep?: string,
  ) {
    if (!rejectRequestId) return;
    setActing(true);
    try {
      await adminSellerVerificationService.reject(role, rejectRequestId, reason, targetStep);
      feedback.success('Verification rejected', 'The seller has been notified.');
      setRejectRequestId(null);
      setReviewRequestId(undefined);
      setReviewUserId(undefined);
      await reload();
    } catch (err) {
      feedback.error(
        'Failed to reject verification',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setActing(false);
    }
  }

  async function handleSuspend(payload: {
    reason: string;
    duration?: '7_days' | '30_days' | 'permanent';
  }) {
    if (!suspendDetail) return;
    setActing(true);
    try {
      await adminSellerVerificationService.suspendSeller(role, {
        userId: suspendDetail.userId,
        reason: payload.reason,
        duration: payload.duration,
      });
      feedback.success('Seller suspended', 'Selling privileges have been restricted.');
      setSuspendDetail(null);
      await reload();
    } catch (err) {
      feedback.error(
        'Failed to suspend seller',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setActing(false);
    }
  }

  async function handleReactivate(payload: { reason: string }) {
    if (!reactivateDetail) return;
    setActing(true);
    try {
      await adminSellerVerificationService.reactivateSeller(role, {
        userId: reactivateDetail.userId,
        reason: payload.reason,
      });
      feedback.success('Seller reactivated', 'Selling privileges have been restored.');
      setReactivateDetail(null);
      setReviewRequestId(undefined);
      setReviewUserId(undefined);
      await reload();
    } catch (err) {
      feedback.error(
        'Failed to reactivate seller',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setActing(false);
    }
  }

  async function handleForceReverify(payload: { reason: string }) {
    if (!forceReverifyDetail) return;
    setActing(true);
    try {
      await adminSellerVerificationService.forceReverify(role, {
        userId: forceReverifyDetail.userId,
        reason: payload.reason,
      });
      feedback.success('Re-verification required', 'The seller must submit documents again.');
      setForceReverifyDetail(null);
      setReviewRequestId(undefined);
      setReviewUserId(undefined);
      await reload();
    } catch (err) {
      feedback.error(
        'Failed to force re-verification',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setActing(false);
    }
  }

  async function handleSetLimit(payload: { sellerLimit: number; reason?: string }) {
    if (!limitDetail) return;
    setActing(true);
    try {
      await adminSellerVerificationService.setSellerLimit(role, {
        userId: limitDetail.userId,
        sellerLimit: payload.sellerLimit,
        reason: payload.reason,
      });
      feedback.success('Listing limit updated', "The seller's listing cap has changed.");
      setLimitDetail(null);
      await reload();
    } catch (err) {
      feedback.error(
        'Failed to update listing limit',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setActing(false);
    }
  }

  const columns =
    activeView === 'approved'
      ? ['Seller', 'Submitted', 'Status', 'Verified at', 'Actions']
      : activeView === 'rejected'
        ? ['Seller', 'Submitted', 'Status', 'Rejection reason', 'Actions']
        : ['Seller', 'Submitted', 'Status', 'Details', 'Actions'];

  if (!permissionsLoading && !canReview && !can(PERMISSIONS.VIEW_SELLER_DOCUMENTS)) {
    return (
      <DashboardPageShell
        title="Seller Verification"
        description="Review seller identity verification requests."
        loading={false}
        error="Insufficient permissions to access seller verification."
        empty={false}
      >
        <div />
      </DashboardPageShell>
    );
  }

  return (
    <>
      <DashboardPageShell
        title="Seller Verification"
        description={`${ADMIN_SELLER_VERIFICATION_VIEW_LABELS[activeView]} — review seller identity documents, manage verification status, and enforce seller limits.`}
        loading={loading || permissionsLoading}
        error={error}
        empty={false}
      >
        <Card>
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email"
              className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm md:col-span-2"
            />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            />
          </div>
          {activeView === 'pending' ? (
            <div
              className="mb-4 flex flex-wrap gap-2"
              role="tablist"
              aria-label="Verification track filter"
            >
              {(
                [
                  ['all', 'All'],
                  ['fast_track', 'Fast-track'],
                  ['standard', 'Standard'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={trackFilter === value}
                  onClick={() => {
                    setTrackFilter(value);
                    setPage(1);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    trackFilter === value
                      ? 'bg-[hsl(var(--dashboard-accent))] text-white'
                      : 'bg-[hsl(var(--dashboard-sidebar-active)/0.5)] text-[hsl(var(--dashboard-sidebar-muted))] hover:text-[hsl(var(--dashboard-main-fg))]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="mb-4 flex items-center justify-between gap-3 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            <label className="flex items-center gap-2">
              Rows per page
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-md border border-[hsl(var(--dashboard-sidebar-border))] px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => void reload()}
              className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-1.5 font-medium text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)]"
            >
              Apply filters
            </button>
          </div>

          {!canViewDocs ? (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              You can browse requests, but document viewing requires the view_seller_documents permission.
            </p>
          ) : null}

          {!loading && !error && rows.length === 0 ? (
            <DashboardFilteredEmptyState
              title={
                activeView === 'pending' && trackFilter !== 'all'
                  ? `No ${trackFilter === 'fast_track' ? 'fast-track' : 'standard'} pending requests`
                  : `No ${ADMIN_SELLER_VERIFICATION_VIEW_LABELS[activeView].toLowerCase()}`
              }
              description={
                activeView === 'pending' && trackFilter !== 'all'
                  ? 'Switch to All or another track filter above to continue reviewing.'
                  : undefined
              }
              hasActiveFilters={activeView === 'pending' && trackFilter !== 'all'}
              onClearFilters={
                activeView === 'pending' && trackFilter !== 'all'
                  ? () => {
                      setTrackFilter('all');
                      setPage(1);
                    }
                  : undefined
              }
            />
          ) : (
            <>
              <DataTable columns={columns} rows={rows} />
              <AdminTableFooter
                page={page}
                totalPages={totalPages}
                total={meta.total}
                onPageChange={setPage}
              />
            </>
          )}
        </Card>
      </DashboardPageShell>

      <VerificationReviewModal
        open={Boolean(reviewRequestId || reviewUserId)}
        role={role}
        requestId={reviewRequestId}
        userId={reviewUserId}
        canViewDocuments={canViewDocs}
        canReview={canReview}
        canSuspend={canSuspend}
        canReactivate={canReactivate}
        canForceReverify={canForceReverify}
        canManageLimits={canManageLimits}
        onClose={() => {
          setReviewRequestId(undefined);
          setReviewUserId(undefined);
        }}
        onApprove={(id) => setApproveRequestId(id)}
        onReject={(id, options) => {
          setRejectRequestId(id);
          setRejectSellerName(reviewSellerName ?? 'Seller');
          setRejectIsFastTrack(Boolean(options?.isFastTrack));
        }}
        onSuspend={(detail) => setSuspendDetail(detail)}
        onReactivate={(detail) => setReactivateDetail(detail)}
        onForceReverify={(detail) => setForceReverifyDetail(detail)}
        onSetLimit={(detail) => setLimitDetail(detail)}
        onViewHistory={(userId, sellerName) => {
          setHistoryUserId(userId);
          setHistorySellerName(sellerName);
        }}
      />

      <ConfirmDialog
        open={approveRequestId != null}
        title="Approve this seller?"
        message="The seller will be marked as verified and can create unlimited listings."
        confirmLabel="Approve verification"
        loading={acting}
        onConfirm={() => void handleApproveConfirm()}
        onCancel={() => setApproveRequestId(null)}
      />

      <RejectVerificationModal
        open={rejectRequestId != null}
        sellerName={rejectSellerName}
        isFastTrack={rejectIsFastTrack}
        loading={acting}
        onSubmit={(reason, requestAdditionalDocs, targetStep) =>
          void handleRejectSubmit(reason, requestAdditionalDocs, targetStep)
        }
        onClose={() => {
          setRejectRequestId(null);
          setRejectIsFastTrack(false);
        }}
      />

      <SuspendSellerModal
        open={suspendDetail != null}
        sellerName={suspendDetail?.sellerName ?? suspendDetail?.email ?? 'Seller'}
        loading={acting}
        onSubmit={(payload) => void handleSuspend(payload)}
        onClose={() => setSuspendDetail(null)}
      />

      <ReactivateSellerModal
        open={reactivateDetail != null}
        sellerName={reactivateDetail?.sellerName ?? reactivateDetail?.email ?? 'Seller'}
        loading={acting}
        onSubmit={(payload) => void handleReactivate(payload)}
        onClose={() => setReactivateDetail(null)}
      />

      <ForceReverifyModal
        open={forceReverifyDetail != null}
        sellerName={forceReverifyDetail?.sellerName ?? forceReverifyDetail?.email ?? 'Seller'}
        loading={acting}
        onSubmit={(payload) => void handleForceReverify(payload)}
        onClose={() => setForceReverifyDetail(null)}
      />

      <SetListingLimitModal
        open={limitDetail != null}
        sellerName={limitDetail?.sellerName ?? limitDetail?.email ?? 'Seller'}
        currentLimit={limitDetail?.sellerLimit ?? 5}
        loading={acting}
        onSubmit={(payload) => void handleSetLimit(payload)}
        onClose={() => setLimitDetail(null)}
      />

      <StatusHistoryModal
        open={historyUserId != null}
        role={role}
        userId={historyUserId}
        sellerName={historySellerName}
        onClose={() => setHistoryUserId(null)}
      />
    </>
  );
}
