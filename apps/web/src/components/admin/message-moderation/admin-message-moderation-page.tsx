'use client';

import { useCallback, useState } from 'react';

import type { AdminMessageFlagItem } from '@community-marketplace/types';

import {
  Card,
  IconActionButton,
  IconActionGroup,
} from '@community-marketplace/ui-dashboard';

import { AdminTableFooter } from '@/components/dashboard/admin-table-footer';
import { DashboardPageShell, DataTable } from '@/components/dashboard/async-resource';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { adminChatModerationService, type AdminServiceRole } from '@/services/admin-chat-moderation.service';

interface AdminMessageModerationPageProps {
  role: AdminServiceRole;
  canModerate: boolean;
  canSuspendSeller: boolean;
}

export function AdminMessageModerationPage({
  role,
  canModerate,
  canSuspendSeller,
}: AdminMessageModerationPageProps) {
  const [actingId, setActingId] = useState<string | null>(null);
  const [viewThreadId, setViewThreadId] = useState<string | null>(null);
  const [threadDetail, setThreadDetail] = useState<Awaited<
    ReturnType<typeof adminChatModerationService.getThread>
  > | null>(null);

  const fetchFlags = useCallback(
    (page: number, limit: number) =>
      adminChatModerationService.listMessageFlags(role, { page, limit, status: 'open' }),
    [role],
  );

  const {
    page,
    setPage,
    data: flags,
    meta,
    loading,
    error,
    totalPages,
    reload,
  } = usePaginatedQuery({ fetcher: fetchFlags });

  async function handleResolve(flag: AdminMessageFlagItem, status: 'resolved' | 'dismissed') {
    if (!canModerate) return;
    const notes =
      window.prompt(
        `Notes for marking report as ${status}?`,
        flag.moderationNotes ?? '',
      ) ?? undefined;
    if (notes === null && status === 'resolved') return;

    setActingId(flag.id);
    try {
      await adminChatModerationService.resolveFlag(role, flag.id, {
        status,
        ...(notes ? { moderationNotes: notes } : {}),
      });
      await reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to resolve report');
    } finally {
      setActingId(null);
    }
  }

  async function handleViewThread(flag: AdminMessageFlagItem) {
    setViewThreadId(flag.threadId);
    setThreadDetail(null);
    try {
      const detail = await adminChatModerationService.getThread(role, flag.threadId);
      setThreadDetail(detail);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to load conversation');
      setViewThreadId(null);
    }
  }

  async function handleSuspendSeller(flag: AdminMessageFlagItem) {
    if (!canSuspendSeller) return;
    const reason =
      window.prompt(`Suspend seller ${flag.sellerDisplayName ?? flag.sellerId}? Reason:`) ?? '';
    if (!reason.trim()) return;

    setActingId(flag.id);
    try {
      await adminChatModerationService.suspendSeller(role, flag.sellerId, reason.trim());
      await reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to suspend seller');
    } finally {
      setActingId(null);
    }
  }

  const rows = flags.map((flag) => {
    const isActing = actingId === flag.id;
    return [
      flag.id.slice(0, 8),
      flag.reason,
      flag.messageContent.slice(0, 60) + (flag.messageContent.length > 60 ? '…' : ''),
      flag.listingTitle,
      flag.reporterDisplayName ?? flag.reporterId?.slice(0, 8) ?? '—',
      <div key={flag.id} className="flex flex-wrap gap-2">
        <IconActionGroup>
          <IconActionButton
            icon="eye"
            label="View conversation"
            disabled={isActing}
            onClick={() => void handleViewThread(flag)}
          />
          {canModerate && (
            <>
              <IconActionButton
                icon="check"
                label="Mark resolved"
                disabled={isActing}
                onClick={() => void handleResolve(flag, 'resolved')}
              />
              <IconActionButton
                icon="x"
                label="Dismiss"
                disabled={isActing}
                onClick={() => void handleResolve(flag, 'dismissed')}
              />
            </>
          )}
          {canSuspendSeller && (
            <IconActionButton
              icon="user-minus"
              label="Suspend seller"
              variant="danger"
              disabled={isActing}
              onClick={() => void handleSuspendSeller(flag)}
            />
          )}
        </IconActionGroup>
      </div>,
    ];
  });

  return (
    <>
      <DashboardPageShell
        title="Message Moderation"
        description="Review reported buyer–seller messages and take enforcement action."
        loading={loading}
        error={error}
        empty={!loading && !error && rows.length === 0}
        emptyTitle="No reported messages"
      >
        <Card>
          <DataTable
            columns={['ID', 'Reason', 'Message', 'Listing', 'Reporter', 'Actions']}
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

      {viewThreadId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] shadow-xl">
            <div className="flex items-center justify-between border-b border-[hsl(var(--dashboard-sidebar-border))] px-4 py-3">
              <h3 className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]">Conversation history</h3>
              <button
                type="button"
                onClick={() => {
                  setViewThreadId(null);
                  setThreadDetail(null);
                }}
                className="text-sm text-[hsl(var(--dashboard-sidebar-muted))] hover:text-[hsl(var(--dashboard-main-fg))]"
              >
                Close
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {!threadDetail ? (
                <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
              ) : (
                threadDetail.messages?.map((msg: { id: string; content: string; createdAt: string; senderId: string }) => (
                  <div key={msg.id} className="rounded-lg bg-[hsl(var(--dashboard-sidebar-active)/0.35)] px-3 py-2 text-sm">
                    <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                      {new Date(msg.createdAt).toLocaleString()} · {msg.senderId.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-[hsl(var(--dashboard-main-fg))]">{msg.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
