'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@community-marketplace/ui';
import { Card, IconActionButton, IconActionGroup } from '@community-marketplace/ui-dashboard';

import { EmptyState } from '@/components/EmptyState';
import { DataTable, DashboardPageShell } from '@/components/dashboard/async-resource';
import { SendAdminInvitationModal } from '@/components/dashboard/send-admin-invitation-modal';
import { adminService, type AdminInvitationRow } from '@/services/admin.service';

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function SuperAdminInvitationsPage() {
  const [rows, setRows] = useState<AdminInvitationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.listAdminInvitations();
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleResend = async (id: string) => {
    setActionId(id);
    try {
      await adminService.resendAdminInvitation(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend invitation');
    } finally {
      setActionId(null);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Revoke this invitation? The link will stop working immediately.')) {
      return;
    }
    setActionId(id);
    try {
      await adminService.revokeAdminInvitation(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke invitation');
    } finally {
      setActionId(null);
    }
  };

  const tableRows = rows.map((invitation) => [
    invitation.email,
    invitation.roleName,
    formatExpiry(invitation.expiresAt),
    <IconActionGroup key={invitation.id}>
      <IconActionButton
        icon="mail"
        label="Resend invitation"
        onClick={() => void handleResend(invitation.id)}
        disabled={actionId === invitation.id}
      />
      <IconActionButton
        icon="trash"
        label="Revoke invitation"
        variant="danger"
        onClick={() => void handleRevoke(invitation.id)}
        disabled={actionId === invitation.id}
      />
    </IconActionGroup>,
  ]);

  return (
    <>
      <DashboardPageShell
        title="Invitations"
        description="Pending admin invitations. Accepted users are managed on the Admins page."
        loading={loading}
        error={error}
      >
        <Card>
          <div className="flex justify-end border-b border-[hsl(var(--dashboard-sidebar-border))] px-4 py-3">
            <Button type="button" onClick={() => setShowSendModal(true)}>
              + Send Invitation
            </Button>
          </div>
          {rows.length === 0 ? (
            <EmptyState
              variant="dashboard"
              title="No pending invitations"
              description="Send an invitation to onboard a level-2 panel operator."
            />
          ) : (
            <DataTable columns={['Email', 'Role', 'Expires', 'Actions']} rows={tableRows} />
          )}
        </Card>
      </DashboardPageShell>
      <SendAdminInvitationModal
        open={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSent={() => void load()}
      />
    </>
  );
}
