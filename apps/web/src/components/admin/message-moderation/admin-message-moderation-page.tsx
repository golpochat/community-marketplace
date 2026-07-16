'use client';

import { useCallback, useState } from 'react';

import type { AdminMessageFlagItem } from '@community-marketplace/types';
import { useAppFeedback } from '@community-marketplace/ui';

import {
  Card,
  IconActionButton,
  IconActionGroup,
} from '@community-marketplace/ui-dashboard';

import { AdminTableFooter } from '@/components/dashboard/admin-table-footer';
import { DashboardPageShell, DataTable } from '@/components/dashboard/async-resource';
import { DashboardTableBody } from '@/components/dashboard/dashboard-filtered-empty-state';
import { ReasonPromptDialog } from '@/components/shared/reason-prompt-dialog';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { adminChatModerationService, type AdminServiceRole } from '@/services/admin-chat-moderation.service';

interface AdminMessageModerationPageProps {
  role: AdminServiceRole;
  canModerate: boolean;
  canSuspendSeller: boolean;
}

type MessagePrompt =
  | { flag: AdminMessageFlagItem; kind: 'resolve'; status: 'resolved' | 'dismissed' }
  | { flag: AdminMessageFlagItem; kind: 'suspend' };

export function AdminMessageModerationPage({
  role,
  canModerate,
  canSuspendSeller,
}: AdminMessageModerationPageProps) {
  const feedback = useAppFeedback();
  const [actingId, setActingId] = useState<string | null>(null);
  const [viewThreadId, setViewThreadId] = useState<string | null>(null);
  const [messagePrompt, setMessagePrompt] = useState<MessagePrompt | null>(null);
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

  async function handleResolveConfirm(notes: string) {
    if (!messagePrompt || messagePrompt.kind !== 'resolve') return;
    const { flag, status } = messagePrompt;

    setActingId(flag.id);
    try {
      await adminChatModerationService.resolveFlag(role, flag.id, {
        status,
        ...(notes ? { moderationNotes: notes } : {}),
      });
      feedback.success(
        status === 'resolved' ? 'Report resolved' : 'Report dismissed',
        `Flag ${flag.id.slice(0, 8)} updated.`,
      );
      setMessagePrompt(null);
      await reload();
    } catch (err) {
      feedback.error(
        'Failed to resolve report',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setActingId(null);
    }
  }

  async function handleSuspendConfirm(reason: string) {
    if (!messagePrompt || messagePrompt.kind !== 'suspend') return;
    const { flag } = messagePrompt;

    setActingId(flag.id);
    try {
      await adminChatModerationService.suspendSeller(role, flag.sellerId, reason);
      feedback.success('Seller suspended', flag.sellerDisplayName ?? flag.sellerId.slice(0, 8));
      setMessagePrompt(null);
      await reload();
    } catch (err) {
      feedback.error(
        'Failed to suspend seller',
        err instanceof Error ? err.message : 'Please try again.',
      );
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
      feedback.error(
        'Failed to load conversation',
        err instanceof Error ? err.message : 'Please try again.',
      );
      setViewThreadId(null);
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
                onClick={() =>
                  setMessagePrompt({ flag, kind: 'resolve', status: 'resolved' })
                }
              />
              <IconActionButton
                icon="x"
                label="Dismiss"
                disabled={isActing}
                onClick={() =>
                  setMessagePrompt({ flag, kind: 'resolve', status: 'dismissed' })
                }
              />
            </>
          )}
          {canSuspendSeller && (
            <IconActionButton
              icon="user-minus"
              label="Suspend seller"
              variant="danger"
              disabled={isActing}
              onClick={() => setMessagePrompt({ flag, kind: 'suspend' })}
            />
          )}
        </IconActionGroup>
      </div>,
    ];
  });

  const resolvePrompt =
    messagePrompt?.kind === 'resolve' ? messagePrompt : null;
  const suspendPrompt =
    messagePrompt?.kind === 'suspend' ? messagePrompt : null;

  return (
    <>
      <DashboardPageShell
        title="Message Moderation"
        description="Review reported buyer–seller messages and take enforcement action."
        loading={loading}
        error={error}
        empty={!loading && !error && rows.length === 0}
        emptyPreserveFilters
        emptyTitle="No reported messages"
        emptyDescription="Open message reports will appear here when users flag a conversation."
      >
        <Card>
          <DashboardTableBody
            isEmpty={rows.length === 0}
            emptyTitle="No reported messages"
            emptyDescription="Open message reports will appear here when users flag a conversation."
          >
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
          </DashboardTableBody>
        </Card>
      </DashboardPageShell>

      <ReasonPromptDialog
        open={resolvePrompt != null}
        elevated
        title={
          resolvePrompt?.status === 'resolved' ? 'Mark report resolved' : 'Dismiss report'
        }
        description={
          resolvePrompt
            ? `Add notes for flag ${resolvePrompt.flag.id.slice(0, 8)}.`
            : undefined
        }
        label="Moderation notes"
        placeholder="Optional notes about this report…"
        confirmLabel={resolvePrompt?.status === 'resolved' ? 'Mark resolved' : 'Dismiss report'}
        required={false}
        defaultValue={resolvePrompt?.flag.moderationNotes ?? ''}
        loading={actingId === resolvePrompt?.flag.id}
        onConfirm={(notes) => void handleResolveConfirm(notes)}
        onClose={() => {
          if (actingId === null) setMessagePrompt(null);
        }}
      />

      <ReasonPromptDialog
        open={suspendPrompt != null}
        elevated
        title="Suspend seller"
        description={
          suspendPrompt
            ? `Suspend ${suspendPrompt.flag.sellerDisplayName ?? suspendPrompt.flag.sellerId.slice(0, 8)} for policy violations.`
            : undefined
        }
        label="Suspension reason"
        placeholder="Explain why this seller is being suspended…"
        confirmLabel="Suspend seller"
        variant="destructive"
        required
        loading={actingId === suspendPrompt?.flag.id}
        onConfirm={(reason) => void handleSuspendConfirm(reason)}
        onClose={() => {
          if (actingId === null) setMessagePrompt(null);
        }}
      />

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
