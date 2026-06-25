'use client';

import { useCallback, useEffect, useState } from 'react';

import { formatCurrency } from '@community-marketplace/utils';
import { Card } from '@community-marketplace/ui-dashboard';

import { DashboardPageShell, DataTable, KeyValueList } from '@/components/dashboard/async-resource';
import { adminService, type AdminServiceRole } from '@/services/admin.service';

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
  const [rows, setRows] = useState<Array<Array<React.ReactNode>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminService.listUsers(role);
      setRows(
        result.data.map((user) => [
          user.displayName ?? user.email,
          user.email,
          user.role,
          user.status,
        ]),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

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
        <DataTable columns={['Name', 'Email', 'Role', 'Status']} rows={rows} />
      </Card>
    </DashboardPageShell>
  );
}

export function AdminListingsPage({ role }: { role: AdminServiceRole }) {
  const [rows, setRows] = useState<Array<Array<React.ReactNode>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void adminService
      .listListings(role)
      .then((result) => {
        if (cancelled) return;
        setRows(
          result.data.map((listing) => [
            listing.title,
            formatCurrency(listing.price, listing.currency),
            listing.status,
            new Date(listing.createdAt).toLocaleDateString(),
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
      title="Listings"
      description="Review and manage marketplace listings."
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      emptyTitle="No listings found"
    >
      <Card>
        <DataTable columns={['Title', 'Price', 'Status', 'Created']} rows={rows} />
      </Card>
    </DashboardPageShell>
  );
}

export function AdminPaymentsPage({ role }: { role: AdminServiceRole }) {
  const [rows, setRows] = useState<Array<Array<React.ReactNode>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void adminService
      .listPayments(role)
      .then((result) => {
        if (cancelled) return;
        setRows(
          result.data.map((payment) => [
            payment.id.slice(0, 8),
            formatCurrency(payment.amount, payment.currency),
            payment.status,
            payment.listingId.slice(0, 8),
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
      title="Payments"
      description="Monitor transactions, payouts, and payment disputes."
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      emptyTitle="No payments found"
    >
      <Card>
        <DataTable columns={['ID', 'Amount', 'Status', 'Listing']} rows={rows} />
      </Card>
    </DashboardPageShell>
  );
}

export function AdminModerationPage({ role }: { role: AdminServiceRole }) {
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
      title="Moderation"
      description="Handle reports, appeals, and content enforcement."
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
  const [rows, setRows] = useState<Array<Array<React.ReactNode>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void adminService
      .listPendingVerifications(role)
      .then((result) => {
        if (cancelled) return;
        setRows(
          result.data.map((item) => [
            item.userId.slice(0, 8),
            item.status,
            item.badgeGranted ? 'Yes' : 'No',
            new Date(item.createdAt).toLocaleDateString(),
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
      title="Verifications"
      description="Review seller identity verification requests."
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      emptyTitle="No pending verifications"
    >
      <Card>
        <DataTable columns={['User', 'Status', 'Badge', 'Submitted']} rows={rows} />
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
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void adminService
      .getPlatformSettings()
      .then((data) => {
        if (!cancelled) setSettings(data as Record<string, unknown> | null);
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
      title="Settings"
      description="Global platform configuration and feature flags."
      loading={loading}
      error={error}
      empty={!loading && !error && !settings}
      emptyTitle="Settings unavailable"
    >
      <Card title="Platform settings">
        <pre className="overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-900">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </Card>
    </DashboardPageShell>
  );
}
