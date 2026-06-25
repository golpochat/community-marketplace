'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ModerationReport, PlatformSettings, UserProfile, UserVerification } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { Card } from '@community-marketplace/ui-dashboard';

import { DashboardPageShell, DataTable, KeyValueList } from '@/components/dashboard/async-resource';
import { AdminTableFooter } from '@/components/dashboard/admin-table-footer';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { adminService, type AdminServiceRole } from '@/services/admin.service';

function AdminRowButton({
  label,
  onClick,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'secondary';
}) {
  const classes =
    variant === 'danger'
      ? 'border-red-200 text-red-700 hover:bg-red-50'
      : variant === 'secondary'
        ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
        : 'border-transparent bg-[hsl(var(--dashboard-accent))] text-white hover:opacity-90';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50 ${classes}`}
    >
      {label}
    </button>
  );
}

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
        <AdminRowButton
          label={isActing ? 'Working…' : 'Suspend'}
          onClick={() => void handleSuspend(user)}
          disabled={isProtectedRole || isActing || user.status === 'suspended'}
          variant="secondary"
        />
        <AdminRowButton
          label="Ban"
          onClick={() => void handleBan(user)}
          disabled={isProtectedRole || isActing}
          variant="danger"
        />
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
  const fetchListings = useCallback(
    (page: number, limit: number) => adminService.listListings(role, { page, limit }),
    [role],
  );

  const { page, setPage, data, meta, loading, error, totalPages } = usePaginatedQuery({
    fetcher: fetchListings,
  });

  const rows = data.map((listing) => [
    listing.title,
    formatCurrency(listing.price, listing.currency),
    listing.status,
    new Date(listing.createdAt).toLocaleDateString(),
  ]);

  return (
    <DashboardPageShell
      title="Listings"
      description="Review and manage marketplace listings."
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      emptyTitle="No listings found"
    >
      <Card>
        <DataTable columns={['Title', 'Price', 'Status', 'Created']} rows={rows} />
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
        <AdminRowButton
          label={isActing ? 'Working…' : 'Warn'}
          onClick={() => void handleAction(report, 'warn')}
          disabled={!canAct || isActing}
          variant="secondary"
        />
        {report.listingId && (
          <AdminRowButton
            label="Remove listing"
            onClick={() => void handleAction(report, 'delete_listing')}
            disabled={!canAct || isActing}
            variant="danger"
          />
        )}
        <AdminRowButton
          label="Suspend user"
          onClick={() => void handleAction(report, 'suspend')}
          disabled={!canAct || isActing}
          variant="danger"
        />
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
        <AdminRowButton
          label={isActing ? 'Working…' : 'Approve'}
          onClick={() => void handleApprove(item)}
          disabled={isActing}
        />
        <AdminRowButton
          label="Reject"
          onClick={() => void handleReject(item)}
          disabled={isActing}
          variant="danger"
        />
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
  const [rows, setRows] = useState<Array<Array<React.ReactNode>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void adminService
      .listNotificationLogs(role)
      .then((result) => {
        if (cancelled) return;
        setRows(
          result.data.map((log, index) => {
            const entry = log as Record<string, unknown>;
            return [
              String(entry.id ?? index),
              String(entry.channel ?? '—'),
              String(entry.status ?? '—'),
              String(entry.createdAt ?? '—'),
            ];
          }),
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
      title="Notifications"
      description="Broadcast and delivery logs for platform notifications."
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      emptyTitle="No notification logs"
    >
      <Card>
        <DataTable columns={['ID', 'Channel', 'Status', 'Created']} rows={rows} />
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
  const [matrix, setMatrix] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void adminService
      .getRoleMatrix(role)
      .then((data) => {
        if (!cancelled) setMatrix(data);
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
      title="RBAC"
      description="Roles, permissions, and access control policies."
      loading={loading}
      error={error}
      empty={!loading && !error && !matrix}
      emptyTitle="RBAC data unavailable"
    >
      <Card title="Role permission matrix">
        <pre className="overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-900">
          {JSON.stringify(matrix, null, 2)}
        </pre>
      </Card>
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
