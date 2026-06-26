'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Category, ListingStatus, ModerationReport, PlatformSettings, UserProfile, UserVerification } from '@community-marketplace/types';
import { formatCurrency, formatDateTime } from '@community-marketplace/utils';
import {
  Card,
  IconActionButton,
  IconActionGroup,
  ListingStatusBadge,
  TruncatedText,
} from '@community-marketplace/ui-dashboard';

import { AdminRbacManager } from '@/components/dashboard/admin-rbac-manager';
import { DashboardPageShell, DataTable, KeyValueList } from '@/components/dashboard/async-resource';
import { AdminTableFooter } from '@/components/dashboard/admin-table-footer';
import { AdminListingReviewDialog } from '@/components/dashboard/admin-listing-review-dialog';
import { AdminListingStatusHistoryDialog } from '@/components/dashboard/admin-listing-status-history-dialog';
import {
  formatNotificationChannelLabel,
  formatNotificationTypeLabel,
  NotificationDeliveryStatusBadge,
} from '@/components/notifications/notification-delivery-labels';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
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
  const [actingUserId, setActingUserId] = useState<string | null>(null);

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

  async function handleSuspend(user: UserProfile) {
    const reason = window.prompt(`Reason for suspending ${user.email}?`) ?? undefined;
    if (reason === null) return;
    setActingUserId(user.id);
    try {
      await adminService.suspendUser(role, user.id, reason || undefined);
      await reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to suspend user');
    } finally {
      setActingUserId(null);
    }
  }

  async function handleBan(user: UserProfile) {
    const reason = window.prompt(`Reason for banning ${user.email}?`) ?? undefined;
    if (reason === null) return;
    setActingUserId(user.id);
    try {
      await adminService.banUser(role, user.id, 'permanent', reason || undefined);
      await reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to ban user');
    } finally {
      setActingUserId(null);
    }
  }

  const rows = users.map((user) => {
    const isProtectedRole = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const isActing = actingUserId === user.id;

    return [
      user.displayName ?? user.email,
      user.email,
      user.role,
      user.status,
      <div key={user.id} className="flex flex-wrap gap-2">
        <IconActionGroup>
          <IconActionButton
            icon="user-minus"
            label={isActing ? 'Working…' : 'Suspend user'}
            disabled={isProtectedRole || isActing || user.status === 'suspended'}
            onClick={() => void handleSuspend(user)}
          />
          <IconActionButton
            icon="ban"
            label="Ban user"
            variant="danger"
            disabled={isProtectedRole || isActing}
            onClick={() => void handleBan(user)}
          />
        </IconActionGroup>
      </div>,
    ];
  });

  return (
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
      <div key={`dates-${listing.id}`} className="space-y-0.5 text-xs text-gray-600">
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
            className="min-w-[220px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
            aria-label="Search listings"
          />
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
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
            className="min-w-[180px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
            aria-label="Filter listings by seller ID"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ListingStatus | '');
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
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
      title="Verifications"
      description="Review seller identity verification requests."
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
  const [items, setItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void adminService
      .listAuditLogs(role)
      .then((logs) => {
        if (!cancelled) setItems(logs);
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
      title="Audit Log"
      description="Review privileged actions and system audit trails."
      loading={loading}
      error={error}
      empty={!loading && !error && items.length === 0}
      emptyTitle="No audit entries"
    >
      <Card title="Audit trail">
        <pre className="max-h-96 overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-900">
          {JSON.stringify(items, null, 2)}
        </pre>
      </Card>
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
      <p className="font-medium text-gray-900">
        {log.notificationTitle ?? 'System notification'}
      </p>
      {log.notificationType && (
        <p className="text-xs text-gray-500">{formatNotificationTypeLabel(log.notificationType)}</p>
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

export function AdminSearchPage({ role }: { role: AdminServiceRole }) {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void adminService
      .getSearchHealth(role)
      .then((data) => {
        if (!cancelled) setHealth(data);
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
      title={role === 'ADMIN' ? 'Search Tools' : 'Search'}
      description="Meilisearch health and index status."
      loading={loading}
      error={error}
      empty={!loading && !error && !health}
      emptyTitle="Search health unavailable"
    >
      <Card title="Search health">
        <pre className="overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-900">
          {JSON.stringify(health, null, 2)}
        </pre>
      </Card>
    </DashboardPageShell>
  );
}

export function AdminAnalyticsPage({ role }: { role: AdminServiceRole }) {
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void adminService
      .getModerationAnalytics(role)
      .then((data) => {
        if (!cancelled) setAnalytics(data);
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
      title="Analytics"
      description="Platform moderation and operational insights."
      loading={loading}
      error={error}
      empty={!loading && !error && !analytics}
      emptyTitle="Analytics unavailable"
    >
      <Card title="Moderation analytics">
        <pre className="overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-900">
          {JSON.stringify(analytics, null, 2)}
        </pre>
      </Card>
    </DashboardPageShell>
  );
}

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
      description="Create and manage administrator accounts."
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
      title="RBAC"
      description="Create custom roles, assign permissions, and manage access policies."
    >
      <AdminRbacManager role={role} />
    </DashboardPageShell>
  );
}

export function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getPlatformSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updateField<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await adminService.updatePlatformSettings(settings);
      setSettings(updated);
      setMessage('Platform settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardPageShell
      title="Settings"
      description="Global platform configuration and feature flags."
      loading={loading}
      error={error}
      empty={!loading && !error && !settings}
      emptyTitle="Settings unavailable"
    >
      {settings && (
        <Card title="Platform settings">
          <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>Maintenance mode</span>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => updateField('maintenanceMode', e.target.checked)}
              />
            </label>
            <div>
              <label className="mb-1 block text-sm font-medium">Platform name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => updateField('platformName', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Support email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => updateField('supportEmail', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Default currency</label>
              <input
                type="text"
                value={settings.defaultCurrency}
                onChange={(e) => updateField('defaultCurrency', e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>Email notifications enabled</span>
              <input
                type="checkbox"
                checked={settings.emailNotificationsEnabled}
                onChange={(e) => updateField('emailNotificationsEnabled', e.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>Push notifications enabled</span>
              <input
                type="checkbox"
                checked={settings.pushNotificationsEnabled}
                onChange={(e) => updateField('pushNotificationsEnabled', e.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>Require MFA for admins</span>
              <input
                type="checkbox"
                checked={settings.securityMfaRequired}
                onChange={(e) => updateField('securityMfaRequired', e.target.checked)}
              />
            </label>
            <div>
              <label className="mb-1 block text-sm font-medium">Payment provider</label>
              <input
                type="text"
                value={settings.paymentProvider}
                onChange={(e) => updateField('paymentProvider', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save settings'}
            </button>
            {message && <p className="text-sm text-green-700">{message}</p>}
          </form>
        </Card>
      )}
    </DashboardPageShell>
  );
}
