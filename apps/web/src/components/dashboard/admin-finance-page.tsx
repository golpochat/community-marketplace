'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { formatCurrency, formatDate } from '@community-marketplace/utils';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

import { DashboardPageShell } from '@/components/dashboard/async-resource';
import {
  defaultRevenueFinanceCategories,
  effectiveFinanceCategories,
  FinanceCategoryFilter,
  includesActivityCategories,
  type FinanceRecordCategory,
} from '@/components/dashboard/finance-category-filter';
import { StatementExportButtons } from '@/components/dashboard/statement-export-buttons';
import {
  monetizationService,
  type AdminFinanceReportFilters,
  type StatementExportFormat,
} from '@/services/monetization.service';
import { type AdminServiceRole } from '@/services/admin.service';

interface FinanceRecord {
  type: 'buyer_purchase' | 'seller_sale' | 'platform_service' | 'marketplace_fee';
  typeLabel: string;
  date: string;
  reference: string;
  party: string;
  partyEmail: string;
  description: string;
  amount: number;
  currency: string;
}

function monthStartIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function recordKey(row: FinanceRecord): string {
  return `${row.type}-${row.reference}-${row.date}-${row.partyEmail}`;
}

function TypeBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex max-w-[9rem] items-center rounded-full bg-[hsl(var(--dashboard-sidebar-active)/0.45)] px-2 py-0.5 text-xs font-medium text-[hsl(var(--dashboard-main-fg))]">
      <span className="truncate">{label}</span>
    </span>
  );
}

function FinanceRecordDetails({ row }: { row: FinanceRecord }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="truncate font-medium text-[hsl(var(--dashboard-main-fg))]">{row.party}</p>
      <p className="truncate text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{row.description}</p>
      <p className="truncate text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{row.partyEmail}</p>
    </div>
  );
}

function FinanceRecordsTable({ records }: { records: FinanceRecord[] }) {
  if (records.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[hsl(var(--dashboard-sidebar-border))] px-4 py-8 text-center text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
        No records for the selected filters.
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[hsl(var(--dashboard-sidebar-bg))] text-[hsl(var(--dashboard-sidebar-muted))]">
            <tr>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Details</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {records.map((row) => (
              <tr key={recordKey(row)} className="border-t border-[hsl(var(--dashboard-sidebar-border))]">
                <td className="px-4 py-3 align-top">
                  <TypeBadge label={row.typeLabel} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top text-[hsl(var(--dashboard-sidebar-muted))]">
                  {formatDate(row.date)}
                </td>
                <td className="px-4 py-3 align-top font-mono text-xs">{row.reference}</td>
                <td className="max-w-[16rem] px-4 py-3 align-top xl:max-w-[24rem]">
                  <FinanceRecordDetails row={row} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right align-top font-medium">
                  {formatCurrency(row.amount, row.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 lg:hidden">
        {records.map((row) => (
          <li
            key={recordKey(row)}
            className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <TypeBadge label={row.typeLabel} />
              <span className="shrink-0 text-sm font-semibold">
                {formatCurrency(row.amount, row.currency)}
              </span>
            </div>
            <dl className="grid gap-2 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Date</dt>
                <dd>{formatDate(row.date)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0 text-[hsl(var(--dashboard-sidebar-muted))]">Reference</dt>
                <dd className="truncate font-mono text-xs">{row.reference}</dd>
              </div>
              <div>
                <dt className="mb-1 text-[hsl(var(--dashboard-sidebar-muted))]">Details</dt>
                <dd>
                  <FinanceRecordDetails row={row} />
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

interface AdminFinancePageProps {
  role: AdminServiceRole;
}

export function AdminFinancePage({ role }: AdminFinancePageProps) {
  const [dateFrom, setDateFrom] = useState(monthStartIso);
  const [dateTo, setDateTo] = useState(todayIso);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<FinanceRecordCategory[]>(defaultRevenueFinanceCategories);
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [platformRevenue, setPlatformRevenue] = useState(0);
  const [activityVolume, setActivityVolume] = useState(0);
  const [currency, setCurrency] = useState('EUR');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<StatementExportFormat | null>(null);

  const effectiveCategories = useMemo(
    () => effectiveFinanceCategories(categories),
    [categories],
  );

  const filters: AdminFinanceReportFilters = {
    dateFrom,
    dateTo,
    categories: effectiveCategories,
    search,
  };

  const loadRecords = useCallback(async () => {
    if (dateFrom > dateTo) {
      setError('Start date must be on or before end date');
      setRecords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await monetizationService.getFinanceReportSummary(role, filters);
      setRecords(data.records);
      setPlatformRevenue(data.summary.totalRevenueGross);
      setActivityVolume(data.summary.activityVolumeGross);
      setCurrency(data.summary.currency);
    } catch (err) {
      setRecords([]);
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }, [role, dateFrom, dateTo, effectiveCategories, search]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  async function handleDownload(format: StatementExportFormat) {
    setDownloading(format);
    setError(null);
    try {
      await monetizationService.downloadFinanceReport(role, filters, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(null);
    }
  }

  return (
    <DashboardPageShell
      title="Financial reports"
      description="Platform revenue for accountancy by default. Add buyer or seller categories to inspect marketplace activity."
      loading={loading}
      error={error}
      empty={false}
    >
      <DashboardCard>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="shrink-0 text-sm">
            <span className="mb-1 block font-medium">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[10.5rem] rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            />
          </label>
          <label className="shrink-0 text-sm">
            <span className="mb-1 block font-medium">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[10.5rem] rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            />
          </label>
          <FinanceCategoryFilter value={categories} onChange={setCategories} />
          <label className="min-w-[12rem] flex-1 text-sm">
            <span className="mb-1 block font-medium">Search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Reference, email, description…"
              className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="space-y-1 text-[hsl(var(--dashboard-sidebar-muted))]">
            <p>
              {records.length} record{records.length === 1 ? '' : 's'} · Platform revenue{' '}
              <span className="font-semibold text-[hsl(var(--dashboard-main-fg))]">
                {formatCurrency(platformRevenue, currency)}
              </span>
            </p>
            {(activityVolume > 0 || includesActivityCategories(effectiveCategories)) && (
              <p className="text-xs">
                Activity volume{' '}
                <span className="font-medium text-[hsl(var(--dashboard-main-fg))]">
                  {formatCurrency(activityVolume, currency)}
                </span>{' '}
                <span className="italic">(informational — not platform income)</span>
              </p>
            )}
          </div>
          <StatementExportButtons onDownload={handleDownload} downloading={downloading} />
        </div>

        <FinanceRecordsTable records={records} />
      </DashboardCard>
    </DashboardPageShell>
  );
}
