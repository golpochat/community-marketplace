'use client';

import { useState } from 'react';

import type {
  ModerationAnalytics,
  ModerationAppeal,
  ModerationReportDetail,
} from '@community-marketplace/types';

import { adminService } from '@/services/admin.service';

type Tab = 'reports' | 'appeals' | 'bans' | 'analytics';

interface BanRow {
  id: string;
  userId: string;
  type: string;
  reason?: string;
  expiresAt?: string;
  user?: { email: string; displayName?: string };
}

interface Props {
  initialReports: { data: ModerationReportDetail[]; meta: { total: number } };
  initialAppeals: { data: ModerationAppeal[]; meta: { total: number } };
  initialBans: BanRow[];
  initialAnalytics: ModerationAnalytics | null;
}

export function ModerationDashboard({
  initialReports,
  initialAppeals,
  initialBans,
  initialAnalytics,
}: Props) {
  const [tab, setTab] = useState<Tab>('reports');
  const [reports, setReports] = useState(initialReports);
  const [appeals, setAppeals] = useState(initialAppeals);
  const [bans, setBans] = useState(initialBans);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [selectedReport, setSelectedReport] = useState<ModerationReportDetail | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'reports', label: `Reports (${reports.meta.total})` },
    { id: 'appeals', label: `Appeals (${appeals.meta.total})` },
    { id: 'bans', label: `Bans (${bans.length})` },
    { id: 'analytics', label: 'Analytics' },
  ];

  async function refreshReports() {
    const result = await adminService.getModerationReports();
    setReports(result as typeof reports);
  }

  async function takeAction(reportId: string, actionType: string) {
    setLoading(true);
    setMessage('');
    try {
      await adminService.takeModerationAction(reportId, {
        actionType,
        notes: actionNotes || undefined,
        suspensionDuration: actionType === 'suspend' ? 'days_7' : undefined,
      });
      setMessage(`Action "${actionType}" applied.`);
      setActionNotes('');
      setSelectedReport(null);
      await refreshReports();
    } catch {
      setMessage('Failed to apply action.');
    } finally {
      setLoading(false);
    }
  }

  async function reviewAppeal(appealId: string, status: 'approved' | 'rejected') {
    setLoading(true);
    try {
      await adminService.reviewAppeal(appealId, { status });
      const result = await adminService.getModerationAppeals();
      setAppeals(result as typeof appeals);
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics() {
    const result = await adminService.getModerationAnalytics();
    setAnalytics(result as ModerationAnalytics);
    setTab('analytics');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => (t.id === 'analytics' ? void loadAnalytics() : setTab(t.id))}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t.id ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && <p className="text-sm text-green-700">{message}</p>}

      {tab === 'reports' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Reason</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {reports.data.map((report) => (
                  <tr
                    key={report.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedReport(report)}
                  >
                    <td className="px-4 py-3">{report.reason}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                        {report.status}
                      </span>
                      {report.autoFlagged && (
                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                          auto-flagged
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {report.listingId ? 'listing' : report.messageId ? 'message' : 'user'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            {selectedReport ? (
              <div className="space-y-4">
                <h3 className="font-semibold">Report detail</h3>
                <p className="text-sm text-gray-600">{selectedReport.description ?? 'No description'}</p>
                {selectedReport.listing && (
                  <p className="text-sm">
                    Listing: <strong>{selectedReport.listing.title}</strong>
                  </p>
                )}
                {selectedReport.targetUser && (
                  <p className="text-sm">
                    User: <strong>{selectedReport.targetUser.email}</strong>
                  </p>
                )}
                <textarea
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                  rows={3}
                  placeholder="Moderation notes"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  {['warn', 'suspend', 'ban', 'delete_listing', 'delete_message'].map((action) => (
                    <button
                      key={action}
                      type="button"
                      disabled={loading}
                      onClick={() => void takeAction(selectedReport.id, action)}
                      className="rounded bg-slate-800 px-3 py-1.5 text-xs text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                      {action.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select a report to review and take action.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'appeals' && (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Message</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {appeals.data.map((appeal) => (
                <tr key={appeal.id}>
                  <td className="max-w-md truncate px-4 py-3">{appeal.message}</td>
                  <td className="px-4 py-3">{appeal.status}</td>
                  <td className="px-4 py-3">
                    {appeal.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => void reviewAppeal(appeal.id, 'approved')}
                          className="text-xs text-green-700 hover:underline"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => void reviewAppeal(appeal.id, 'rejected')}
                          className="text-xs text-red-700 hover:underline"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'bans' && (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-left">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {bans.map((ban) => (
                <tr key={ban.id}>
                  <td className="px-4 py-3">{ban.user?.email ?? ban.userId}</td>
                  <td className="px-4 py-3">{ban.type}</td>
                  <td className="px-4 py-3">{ban.reason ?? '—'}</td>
                  <td className="px-4 py-3">{ban.expiresAt ?? 'Permanent'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'analytics' && analytics && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium">Action statistics</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>Warnings: {analytics.actionStats.warnings}</li>
              <li>Suspensions: {analytics.actionStats.suspensions}</li>
              <li>Bans: {analytics.actionStats.bans}</li>
            </ul>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium">Appeal outcomes</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>Pending: {analytics.appealOutcomes.pending}</li>
              <li>Approved: {analytics.appealOutcomes.approved}</li>
              <li>Rejected: {analytics.appealOutcomes.rejected}</li>
            </ul>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 md:col-span-2">
            <h3 className="font-medium">Report reasons</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {analytics.reasonDistribution.map((r) => (
                <li key={r.reason} className="rounded bg-gray-100 px-2 py-1 text-xs">
                  {r.reason}: {r.count}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
