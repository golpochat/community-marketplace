'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Category, ListingStatus, ModerationReport, PlatformGovernanceSettings, PlatformGovernanceStatus, SuperAdminActivityEvent, UserProfile, UserVerification } from '@community-marketplace/types';
import { isPrivilegedSystemRole } from '@community-marketplace/types';
import { formatCurrency, formatDateTime } from '@community-marketplace/utils';
import {
  Card,
  IconActionButton,
  IconActionGroup,
  ListingStatusBadge,
  TruncatedText,
} from '@community-marketplace/ui-dashboard';

import { AdminRbacManager } from '@/components/dashboard/admin-rbac-manager';
import { AdminEmailSettingsCard } from '@/components/dashboard/admin-email-settings';
import { AdminPlatformGovernanceCard } from '@/components/dashboard/admin-platform-governance';
import { DashboardPageShell, DataTable, KeyValueList } from '@/components/dashboard/async-resource';
import { AdminTableFooter } from '@/components/dashboard/admin-table-footer';
import { AdminListingReviewDialog } from '@/components/dashboard/admin-listing-review-dialog';
import { AdminListingStatusHistoryDialog } from '@/components/dashboard/admin-listing-status-history-dialog';
import { DashboardSectionTabs } from '@/components/dashboard/dashboard-section-tabs';
import {
  AdminToastStack,
  useAdminToast,
} from '@/components/admin/seller-verification/admin-toast';
import { ConfirmDialog } from '@/components/admin/seller-verification/confirm-dialog';
import {
  UserModerationModal,
  type UserModerationSubmitPayload,
} from '@/components/admin/users/user-moderation-modal';
import {
  formatNotificationChannelLabel,
  formatNotificationTypeLabel,
  NotificationDeliveryStatusBadge,
} from '@/components/notifications/notification-delivery-labels';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import {
  formatActivityDetail,
  formatActivityEventType,
  formatActivitySource,
} from '@/lib/super-admin-activity';
import { adminService, type AdminServiceRole } from '@/services/admin.service';
import { listingsService } from '@/services/listings.service';

function moderationReportTarget(report: {
  listingId?: string;
  messageId?: string;
  targetUserId?: string;
}): string {
  if (report.listingId) return 'listing';
  if (report.messageId) return 'message';
  if (report.targetUserId) return 'user';
  return '—';
}

export function AdminUsersPage({ role }: { role: AdminServiceRole }) {
  const { toasts, push, dismiss } = useAdminToast();
  const [actingUserId, setActingUserId] = useState<string | null>(null);
  const [moderationTarget, setModerationTarget] = useState<{
    user: UserProfile;
    action: 'suspend' | 'ban';
  } | null>(null);
  const [reinstateTarget, setReinstateTarget] = useState<UserProfile | null>(null);

  const fetchUsers = useCallback(
    (page: number, limit: number) => adminService.listUsers(role, { page, limit }),
    [role],
  );

  const {
    page,
    setPage,
    data: users,
    meta,
    loading,
    error,
    totalPages,
    reload,
  } = usePaginatedQuery({ fetcher: fetchUsers });

  async function handleModerationSubmit(payload: UserModerationSubmitPayload) {
    if (!moderationTarget) return;
    const { user, action } = moderationTarget;
    setActingUserId(user.id);
    try {
      if (action === 'suspend') {
        await adminService.suspendUser(role, user.id, payload.reason || undefined);
        push(`${user.email} has been suspended.`, 'success');
      } else {
        await adminService.banUser(
          role,
          user.id,
          payload.banType ?? 'permanent',
          payload.reason || undefined,
          payload.expiresAt,
        );
        push(`${user.email} has been banned.`, 'success');
      }
      setModerationTarget(null);
      await reload();
    } catch (err) {
      push(
        err instanceof Error ? err.message : `Failed to ${action} user`,
        'error',
      );
    } finally {
      setActingUserId(null);
    }
  }

  async function handleReinstate() {
    if (!reinstateTarget) return;
    const user = reinstateTarget;
    setActingUserId(user.id);
    try {
      const details = await adminService.getUserDetails(role, user.id);
      for (const ban of details.activeBans ?? []) {
        await adminService.unbanUser(role, user.id, ban.id);
      }
      await adminService.unsuspendUser(role, user.id);
      push(`${user.email} has been reinstated.`, 'success');
      setReinstateTarget(null);
      await reload();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Failed to reinstate user', 'error');
    } finally {
      setActingUserId(null);
    }
  }

  const rows = users.map((user) => {
    const isProtectedRole = isPrivilegedSystemRole(user.role);
    const isActing = actingUserId === user.id;
    const isSuspended = user.status === 'suspended';

    return [
      user.displayName ?? user.email,
      user.email,
      user.role,
      user.status,
      <div key={user.id} className="flex flex-wrap gap-2">
        <IconActionGroup>
          {isSuspended ? (
            <IconActionButton
              icon="circle-check"
              label={isActing ? 'Working…' : 'Reinstate user'}
              variant="accent"
              disabled={isProtectedRole || isActing}
              onClick={() => setReinstateTarget(user)}
            />
          ) : (
            <>
              <IconActionButton
                icon="user-minus"
                label={isActing ? 'Working…' : 'Suspend user'}
                disabled={isProtectedRole || isActing}
                onClick={() => setModerationTarget({ user, action: 'suspend' })}
              />
              <IconActionButton
                icon="ban"
                label="Ban user"
                variant="danger"
                disabled={isProtectedRole || isActing}
                onClick={() => setModerationTarget({ user, action: 'ban' })}
              />
            </>
          )}
        </IconActionGroup>
      </div>,
    ];
  });

  return (
    <>
      <DashboardPageShell
        title="Users"
        description="Manage buyer and seller accounts across the marketplace."
        loading={loading}
        error={error}
        empty={!loading && !error && rows.length === 0}
        emptyTitle="No users found"
      >
        <Card>
          <DataTable columns={['Name', 'Email', 'Role', 'Status', 'Actions']} rows={rows} />
          <AdminTableFooter
            page={page}
            totalPages={totalPages}
            total={meta.total}
            onPageChange={setPage}
          />
        </Card>
      </DashboardPageShell>

      <UserModerationModal
        open={moderationTarget != null}
        action={moderationTarget?.action ?? 'suspend'}
        userEmail={moderationTarget?.user.email ?? ''}
        userName={moderationTarget?.user.displayName}
        loading={actingUserId != null}
        onSubmit={(payload) => void handleModerationSubmit(payload)}
        onClose={() => {
          if (actingUserId == null) setModerationTarget(null);
        }}
      />

      <AdminToastStack toasts={toasts} onDismiss={dismiss} />

      <ConfirmDialog
        open={reinstateTarget != null}
        title="Reinstate user"
        message={
          reinstateTarget
            ? `Restore ${reinstateTarget.email} to active status and lift any active bans?`
            : ''
        }
        confirmLabel="Reinstate"
        tone="primary"
        loading={actingUserId != null}
        onConfirm={() => void handleReinstate()}
        onCancel={() => {
          if (actingUserId == null) setReinstateTarget(null);
        }}
      />
    </>
  );
}

export function AdminListingsPage({ role }: { role: AdminServiceRole }) {
  const [actingListingId, setActingListingId] = useState<string | null>(null);
  const [reviewListingId, setReviewListingId] = useState<string | null>(null);
  const [historyListing, setHistoryListing] = useState<{ id: string; title: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<ListingStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    void listingsService.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const fetchListings = useCallback(
    (page: number, limit: number) =>
      adminService.listListings(role, {
        page,
        limit,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        ...(categoryFilter ? { categoryId: categoryFilter } : {}),
        ...(sellerFilter.trim() ? { sellerId: sellerFilter.trim() } : {}),
      }),
    [role, statusFilter, searchQuery, categoryFilter, sellerFilter],
  );

  const { page, setPage, data, meta, loading, error, totalPages, reload } = usePaginatedQuery({
    fetcher: fetchListings,
  });

  async function handleApprove(listingId: string) {
    setActingListingId(listingId);
    try {
      await adminService.approveListing(role, listingId);
      await reload();
      if (reviewListingId === listingId) setReviewListingId(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to approve listing');
    } finally {
      setActingListingId(null);
    }
  }

  const rows = data.map((listing) => {
    const isActing = actingListingId === listing.id;

    return [
      <TruncatedText key={`title-${listing.id}`} text={listing.title} />,
      formatCurrency(listing.price, listing.currency),
      <ListingStatusBadge key={`status-${listing.id}`} status={listing.status} />,
      <div key={`dates-${listing.id}`} className="space-y-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
        <div>Created: {formatDateTime(listing.createdAt)}</div>
        {listing.activatedAt && <div>Activated: {formatDateTime(listing.activatedAt)}</div>}
        <div>Updated: {formatDateTime(listing.updatedAt)}</div>
        {listing.expiresAt && <div>Expires: {formatDateTime(listing.expiresAt)}</div>}
        {listing.endedAt && <div>Ended: {formatDateTime(listing.endedAt)}</div>}
      </div>,
      listing.status === 'pending_review' || listing.status === 'draft' ? (
        <IconActionGroup key={`actions-${listing.id}`}>
          <IconActionButton
            icon="eye"
            label="Review listing"
            onClick={() => setReviewListingId(listing.id)}
          />
          <IconActionButton
            icon="check"
            label={isActing ? 'Approving…' : 'Approve listing'}
            variant="accent"
            disabled={isActing}
            onClick={() => void handleApprove(listing.id)}
          />
          {listing.status === 'pending_review' ? (
            <IconActionButton
              icon="x"
              label="Reject listing"
              variant="danger"
              disabled={isActing}
              onClick={() => {
                const reason = window.prompt('Rejection reason for the seller:');
                if (!reason?.trim()) return;
                void adminService
                  .rejectListing(role, listing.id, reason.trim())
                  .then(() => reload())
                  .catch((err: Error) => window.alert(err.message));
              }}
            />
          ) : null}
          <IconActionButton
            icon="scroll"
            label="Status history"
            onClick={() => setHistoryListing({ id: listing.id, title: listing.title })}
          />
        </IconActionGroup>
      ) : listing.status === 'active' || listing.status === 'paused' || listing.status === 'expired' ? (
        <IconActionGroup key={`actions-${listing.id}`}>
          <IconActionButton
            icon="trash"
            label="Remove listing"
            variant="danger"
            disabled={isActing}
            onClick={() => {
              const reason = window.prompt('Removal reason (policy violation, fraud, etc.):');
              if (reason === null) return;
              void adminService
                .removeListing(role, listing.id, reason.trim() || undefined)
                .then(() => reload())
                .catch((err: Error) => window.alert(err.message));
            }}
          />
          <IconActionButton
            icon="eye"
            label="Status history"
            onClick={() => setHistoryListing({ id: listing.id, title: listing.title })}
          />
        </IconActionGroup>
      ) : listing.status === 'removed' ? (
        <IconActionGroup key={`actions-${listing.id}`}>
          <IconActionButton
            icon="check"
            label="Restore listing"
            variant="accent"
            disabled={isActing}
            onClick={() => {
              const target =
                window.prompt('Restore to expired or draft?', 'expired')?.trim() ?? 'expired';
              const targetStatus = target === 'draft' ? 'draft' : 'expired';
              void adminService
                .restoreListing(role, listing.id, targetStatus)
                .then(() => reload())
                .catch((err: Error) => window.alert(err.message));
            }}
          />
          <IconActionButton
            icon="eye"
            label="Status history"
            onClick={() => setHistoryListing({ id: listing.id, title: listing.title })}
          />
        </IconActionGroup>
      ) : (
        <IconActionGroup key={`actions-${listing.id}`}>
          <IconActionButton
            icon="eye"
            label="Status history"
            onClick={() => setHistoryListing({ id: listing.id, title: listing.title })}
          />
        </IconActionGroup>
      ),
    ];
  });

  return (
    <DashboardPageShell
      title="Listings"
      description="Review draft and pending listings, then approve them for publication."
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      emptyTitle="No listings found"
    >
      <AdminListingReviewDialog
        open={reviewListingId != null}
        listingId={reviewListingId}
        role={role}
        onClose={() => setReviewListingId(null)}
        onApproved={() => void reload()}
      />
      <AdminListingStatusHistoryDialog
        open={historyListing != null}
        listingId={historyListing?.id ?? null}
        listingTitle={historyListing?.title}
        role={role}
        onClose={() => setHistoryListing(null)}
      />
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search title, description, seller…"
            className="min-w-[220px] flex-1 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))]"
            aria-label="Search listings"
          />
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))]"
            aria-label="Filter listings by category"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={sellerFilter}
            onChange={(e) => {
              setSellerFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Seller user ID"
            className="min-w-[180px] rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))]"
            aria-label="Filter listings by seller ID"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ListingStatus | '');
              setPage(1);
            }}
            className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))]"
            aria-label="Filter listings by status"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending review</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="expired">Expired</option>
            <option value="sold">Sold</option>
            <option value="ended">Ended</option>
            <option value="removed">Removed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <DataTable columns={['Title', 'Price', 'Status', 'Timestamps', 'Actions']} rows={rows} />
        <AdminTableFooter
          page={page}
          totalPages={totalPages}
          total={meta.total}
          onPageChange={setPage}
        />
      </Card>
    </DashboardPageShell>
  );
}

export function AdminPaymentsPage({ role }: { role: AdminServiceRole }) {
  const fetchPayments = useCallback(
    (page: number, limit: number) => adminService.listPayments(role, { page, limit }),
    [role],
  );

  const { page, setPage, data, meta, loading, error, totalPages } = usePaginatedQuery({
    fetcher: fetchPayments,
  });

  const rows = data.map((payment) => [
    payment.id.slice(0, 8),
    formatCurrency(payment.amount, payment.currency),
    payment.status,
    payment.listingId.slice(0, 8),
  ]);

  return (
    <DashboardPageShell
      title="Payments"
      description="Monitor transactions, payouts, and payment disputes."
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      emptyTitle="No payments found"
    >
      <Card>
        <DataTable columns={['ID', 'Amount', 'Status', 'Listing']} rows={rows} />
        <AdminTableFooter
          page={page}
          totalPages={totalPages}
          total={meta.total}
          onPageChange={setPage}
        />
      </Card>
    </DashboardPageShell>
  );
}

export function AdminModerationPage({ role }: { role: AdminServiceRole }) {
  const [actingReportId, setActingReportId] = useState<string | null>(null);

  const fetchReports = useCallback(
    (page: number, limit: number) => adminService.listModerationReports(role, { page, limit }),
    [role],
  );

  const {
    page,
    setPage,
    data: reports,
    meta,
    loading,
    error,
    totalPages,
    reload,
  } = usePaginatedQuery({ fetcher: fetchReports });

  async function handleAction(
    report: ModerationReport,
    actionType: 'warn' | 'delete_listing' | 'suspend',
  ) {
    const notes = window.prompt(`Notes for ${actionType} on report ${report.id.slice(0, 8)}?`) ?? undefined;
    if (notes === null) return;

    setActingReportId(report.id);
    try {
      await adminService.takeModerationAction(role, report.id, {
        actionType,
        ...(actionType === 'suspend' ? { suspensionDuration: 'days_7' as const } : {}),
        ...(notes ? { notes } : {}),
        ...(actionType === 'warn' && notes ? { warnMessage: notes } : {}),
        ...(actionType === 'delete_listing' ? { autoHideListing: true } : {}),
      });
      await reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to take moderation action');
    } finally {
      setActingReportId(null);
    }
  }

  const rows = reports.map((report) => {
    const isActing = actingReportId === report.id;
    const canAct = report.status === 'pending';

    return [
      report.id.slice(0, 8),
      report.reason,
      report.status,
      moderationReportTarget(report),
      <div key={report.id} className="flex flex-wrap gap-2">
        <IconActionGroup>
          <IconActionButton
            icon="alert-triangle"
            label={isActing ? 'Working…' : 'Warn user'}
            disabled={!canAct || isActing}
            onClick={() => void handleAction(report, 'warn')}
          />
          {report.listingId && (
            <IconActionButton
              icon="trash"
              label="Remove listing"
              variant="danger"
              disabled={!canAct || isActing}
              onClick={() => void handleAction(report, 'delete_listing')}
            />
          )}
          <IconActionButton
            icon="user-minus"
            label="Suspend user"
            variant="danger"
            disabled={!canAct || isActing}
            onClick={() => void handleAction(report, 'suspend')}
          />
        </IconActionGroup>
      </div>,
    ];
  });

  return (
    <DashboardPageShell
      title="Moderation"
      description="Handle reports, appeals, and content enforcement."
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      emptyTitle="No reports found"
    >
      <Card>
        <DataTable columns={['ID', 'Reason', 'Status', 'Target', 'Actions']} rows={rows} />
        <AdminTableFooter
          page={page}
          totalPages={totalPages}
          total={meta.total}
          onPageChange={setPage}
        />
      </Card>
    </DashboardPageShell>
  );
}

export function AdminReportsPage({ role }: { role: AdminServiceRole }) {
  const [rows, setRows] = useState<Array<Array<React.ReactNode>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void adminService
      .listModerationReports(role)
      .then((result) => {
        if (cancelled) return;
        setRows(
          result.data.map((report) => [
            report.id.slice(0, 8),
            report.reason,
            report.status,
            moderationReportTarget(report),
          ]),
        );
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  return (
    <DashboardPageShell
      title="Reports"
      description="User and listing reports submitted to moderation."
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      emptyTitle="No reports found"
    >
      <Card>
        <DataTable columns={['ID', 'Reason', 'Status', 'Target']} rows={rows} />
      </Card>
    </DashboardPageShell>
  );
}

export function AdminVerificationsPage({ role }: { role: AdminServiceRole }) {
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchVerifications = useCallback(
    (page: number, limit: number) => adminService.listPendingVerifications(role, { page, limit }),
    [role],
  );

  const {
    page,
    setPage,
    data: verifications,
    meta,
    loading,
    error,
    totalPages,
    reload,
  } = usePaginatedQuery({ fetcher: fetchVerifications });

  async function handleApprove(verification: UserVerification) {
    setActingId(verification.id);
    try {
      await adminService.approveVerification(role, verification.id);
      await reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to approve verification');
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(verification: UserVerification) {
    const reason = window.prompt('Rejection reason (optional):') ?? undefined;
    if (reason === null) return;
    setActingId(verification.id);
    try {
      await adminService.rejectVerification(role, verification.id, reason || undefined);
      await reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to reject verification');
    } finally {
      setActingId(null);
    }
  }

  const rows = verifications.map((item) => {
    const isActing = actingId === item.id;

    return [
      item.userId.slice(0, 8),
      item.status,
      item.badgeGranted ? 'Yes' : 'No',
      new Date(item.createdAt).toLocaleDateString(),
      <div key={item.id} className="flex flex-wrap gap-2">
        <IconActionGroup>
          <IconActionButton
            icon="check"
            label={isActing ? 'Working…' : 'Approve verification'}
            variant="accent"
            disabled={isActing}
            onClick={() => void handleApprove(item)}
          />
          <IconActionButton
            icon="x"
            label="Reject verification"
            variant="danger"
            disabled={isActing}
            onClick={() => void handleReject(item)}
          />
        </IconActionGroup>
      </div>,
    ];
  });

  return (
    <DashboardPageShell
      title="Account Verifications"
      description="Review pending user account and badge verification requests."
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      emptyTitle="No pending verifications"
    >
      <Card>
        <DataTable columns={['User', 'Status', 'Badge', 'Submitted', 'Actions']} rows={rows} />
        <AdminTableFooter
          page={page}
          totalPages={totalPages}
          total={meta.total}
          onPageChange={setPage}
        />
      </Card>
    </DashboardPageShell>
  );
}

export function AdminAuditLogPage({ role }: { role: AdminServiceRole }) {
  const fetchLogs = useCallback(
    (page: number, limit: number) => adminService.listAuditLogs(role, { page, limit }),
    [role],
  );

  const { page, setPage, data, meta, loading, error, totalPages } = usePaginatedQuery({
    fetcher: fetchLogs,
  });

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const superAdminRows =
    isSuperAdmin &&
    data.map((entry) => {
      const event = entry as SuperAdminActivityEvent;
      return [
        event.eventLabel || formatActivityEventType(event),
        formatActivitySource(event.source),
        formatActivityDetail(event),
        formatDateTime(event.createdAt),
      ];
    });

  return (
    <DashboardPageShell
      title="Audit Log"
      description="Review privileged actions and system audit trails."
      loading={loading}
      error={error}
      empty={!loading && !error && data.length === 0}
      emptyTitle="No audit entries"
    >
      {isSuperAdmin && superAdminRows ? (
        <>
          <Card title="Privileged activity trail">
            <DataTable
              columns={['Event', 'Source', 'Details', 'When']}
              rows={superAdminRows}
            />
          </Card>
          <AdminTableFooter
            page={page}
            totalPages={totalPages}
            total={meta.total}
            onPageChange={setPage}
          />
        </>
      ) : (
        <Card title="Audit trail">
          <pre className="max-h-96 overflow-auto rounded-lg bg-[hsl(var(--dashboard-sidebar-active)/0.35)] p-4 text-xs text-[hsl(var(--dashboard-main-fg))]">
            {JSON.stringify(data, null, 2)}
          </pre>
        </Card>
      )}
    </DashboardPageShell>
  );
}

export function AdminNotificationsPage({ role }: { role: AdminServiceRole }) {
  const fetchLogs = useCallback(
    (page: number, limit: number) => adminService.listNotificationLogs(role, { page, limit }),
    [role],
  );

  const { page, setPage, data: logs, meta, loading, error, totalPages } = usePaginatedQuery({
    fetcher: fetchLogs,
  });

  const rows = logs.map((log) => [
    <div key={`${log.id}-title`} className="min-w-0">
      <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">
        {log.notificationTitle ?? 'System notification'}
      </p>
      {log.notificationType && (
        <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{formatNotificationTypeLabel(log.notificationType)}</p>
      )}
    </div>,
    log.recipientLabel ?? '—',
    formatNotificationChannelLabel(log.channel),
    <NotificationDeliveryStatusBadge key={`${log.id}-status`} status={log.status} />,
    log.attempts > 1 ? `${log.attempts} attempts` : '1 attempt',
    formatDateTime(log.createdAt),
  ]);

  return (
    <DashboardPageShell
      title="Notifications"
      description="Recent deliveries across in-app, email, and push channels."
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      emptyTitle="No deliveries yet"
      emptyDescription="Notification delivery attempts will appear here once users receive messages."
    >
      <Card>
        <DataTable
          columns={['Notification', 'Recipient', 'Channel', 'Status', 'Attempts', 'Sent']}
          rows={rows}
        />
        <AdminTableFooter
          page={page}
          totalPages={totalPages}
          total={meta.total}
          onPageChange={setPage}
        />
      </Card>
    </DashboardPageShell>
  );
}

export { AdminSearchPage } from '@/components/admin/search/admin-search-health-page';
export {
  AdminModerationInsightsPage,
  AdminAnalyticsPage,
} from '@/components/admin/analytics/admin-moderation-analytics-page';
export { AdminPlatformMetricsPage } from '@/components/admin/analytics/admin-platform-metrics-page';

export function SuperAdminAdminsPage() {
  const [rows, setRows] = useState<Array<Array<React.ReactNode>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void adminService
      .listAdmins()
      .then((result) => {
        if (cancelled) return;
        setRows(
          result.data.map((admin) => [admin.displayName ?? admin.email, admin.email, admin.role, admin.status]),
        );
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardPageShell
      title="Admins"
      description="Pending invitations are on the Invitations page. Active panel operators are listed below."
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      emptyTitle="No admins found"
    >
      <Card>
        <DataTable columns={['Name', 'Email', 'Role', 'Status']} rows={rows} />
      </Card>
    </DashboardPageShell>
  );
}

export function AdminRbacPage({ role }: { role: AdminServiceRole }) {
  return (
    <DashboardPageShell
      title="Roles & Permissions"
      description="Define who can do what — create roles and assign permissions across the platform."
    >
      <AdminRbacManager role={role} />
    </DashboardPageShell>
  );
}

export function SuperAdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'governance' | 'email'>('governance');
  const [governanceStatus, setGovernanceStatus] = useState<PlatformGovernanceStatus | null>(null);
  const [governanceDraft, setGovernanceDraft] = useState<PlatformGovernanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getPlatformGovernanceStatus();
      setGovernanceStatus(data);
      setGovernanceDraft(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleGovernanceSave(event: React.FormEvent) {
    event.preventDefault();
    if (!governanceDraft) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await adminService.updatePlatformGovernanceSettings(governanceDraft);
      setGovernanceStatus(updated);
      setGovernanceDraft(updated.settings);
      setMessage('Platform settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save platform settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardPageShell
      title="Platform settings"
      description="Configure platform governance and transactional email delivery."
      loading={loading}
      error={error}
      empty={!loading && !error && !governanceStatus}
      emptyTitle="Settings unavailable"
    >
      {governanceStatus && governanceDraft && (
        <>
          <DashboardSectionTabs
            items={[
              { id: 'governance', label: 'Platform governance' },
              { id: 'email', label: 'Transactional email' },
            ]}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as 'governance' | 'email')}
          />
          {activeTab === 'governance' && (
            <AdminPlatformGovernanceCard
              status={governanceStatus}
              draft={governanceDraft}
              saving={saving}
              message={message}
              error={error}
              onDraftChange={setGovernanceDraft}
              onSave={(e) => void handleGovernanceSave(e)}
            />
          )}
          {activeTab === 'email' && <AdminEmailSettingsCard />}
        </>
      )}
    </DashboardPageShell>
  );
}
