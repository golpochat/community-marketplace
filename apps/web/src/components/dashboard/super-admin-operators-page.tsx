'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@community-marketplace/ui';
import { Card, IconActionButton, IconActionGroup } from '@community-marketplace/ui-dashboard';
import {
  ADMIN_PERSONA_DEFINITIONS,
  isAdminPersonaRoleCode,
  type StaffRoleChangeReason,
  type StaffStatusChangeReason,
  type UserProfile,
} from '@community-marketplace/types';

import type { UpdateStaffRoleInput } from '@community-marketplace/validation';

import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/admin/seller-verification/confirm-dialog';
import { DashboardPageShell, DataTable } from '@/components/dashboard/async-resource';
import { DashboardSectionTabs } from '@/components/dashboard/dashboard-section-tabs';
import { SendAdminInvitationModal } from '@/components/dashboard/send-admin-invitation-modal';
import { StaffAdminModifyModal } from '@/components/dashboard/staff-admin-modify-modal';
import { StaffAdminStatusChangeModal } from '@/components/dashboard/staff-admin-status-change-modal';
import { StaffAdminStatusToggle } from '@/components/dashboard/staff-admin-status-toggle';
import { StaffAdminViewModal } from '@/components/dashboard/staff-admin-view-modal';
import { StatCard } from '@/components/dashboard/stat-card';
import {
  adminService,
  type AdminInvitationRow,
} from '@/services/admin.service';

type UserManagementTab = 'admins' | 'invitations';

const USER_MANAGEMENT_TABS = [
  { id: 'admins', label: 'Admins' },
  { id: 'invitations', label: 'Invitations' },
] as const;

const USER_MANAGEMENT_ADMIN_COLUMNS = ['Name', 'Email', 'Role', 'Status', 'Actions'] as const;

const USER_MANAGEMENT_ADMIN_COLUMN_WIDTHS = ['22%', '36%', '20%', '68px', '76px'];

const USER_MANAGEMENT_ADMIN_COLUMN_CLASSES = [
  'min-w-0',
  'min-w-0',
  'min-w-0',
  'px-2',
  'px-2',
] as const;

const USER_MANAGEMENT_PATH = '/super-admin/user-management';

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatRoleLabel(role: string): string {
  if (role === 'ADMIN') return 'Admin';
  if (isAdminPersonaRoleCode(role)) {
    return ADMIN_PERSONA_DEFINITIONS[role].label;
  }
  return role;
}

function isStaffActive(status: string): boolean {
  return status === 'active';
}

export function SuperAdminUserManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<UserManagementTab>('admins');
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [modifyAdmin, setModifyAdmin] = useState<UserProfile | null>(null);
  const [modifyLoading, setModifyLoading] = useState(false);
  const [statusChange, setStatusChange] = useState<{
    admin: UserProfile;
    nextStatus: 'active' | 'inactive';
  } | null>(null);
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'invitations') {
      setActiveTab('invitations');
    } else if (tab === 'admins' || tab === 'active') {
      setActiveTab('admins');
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [adminResult, invitationRows] = await Promise.all([
        adminService.listAdmins(),
        adminService.listAdminInvitations(),
      ]);
      setAdmins(adminResult.data);
      setInvitations(invitationRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user management data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function handleTabChange(tabId: string) {
    const next = tabId as UserManagementTab;
    setActiveTab(next);
    router.replace(
      next === 'invitations' ? `${USER_MANAGEMENT_PATH}?tab=invitations` : USER_MANAGEMENT_PATH,
      { scroll: false },
    );
  }

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
    setActionId(id);
    try {
      await adminService.revokeAdminInvitation(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke invitation');
    } finally {
      setActionId(null);
      setRevokeTargetId(null);
    }
  };

  const handleStatusToggle = (admin: UserProfile) => {
    const nextStatus: 'active' | 'inactive' = isStaffActive(admin.status) ? 'inactive' : 'active';
    setStatusChange({ admin, nextStatus });
  };

  const handleStatusChangeSubmit = async (payload: {
    status: 'active' | 'inactive';
    reason: StaffStatusChangeReason;
    reasonDetail?: string;
  }) => {
    if (!statusChange) return;
    setStatusChangeLoading(true);
    setError(null);
    try {
      await adminService.updateAdminStaffStatus(statusChange.admin.id, payload);
      setStatusChange(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const handleModifySubmit = async (payload: {
    role: string;
    reason: StaffRoleChangeReason;
    reasonDetail?: string;
  }) => {
    if (!modifyAdmin) return;
    setModifyLoading(true);
    setError(null);
    try {
      await adminService.updateAdminStaffRole(modifyAdmin.id, {
        role: payload.role as UpdateStaffRoleInput['role'],
        reason: payload.reason,
        reasonDetail: payload.reasonDetail,
      });
      setModifyAdmin(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setModifyLoading(false);
    }
  };

  const adminRows = admins.map((admin) => {
    const name = admin.displayName?.trim() || '—';
    const roleLabel = formatRoleLabel(admin.role);

    return [
      <span key={`name-${admin.id}`} className="block truncate" title={name}>
        {name}
      </span>,
      <span key={`email-${admin.id}`} className="block truncate" title={admin.email}>
        {admin.email}
      </span>,
      <span key={`role-${admin.id}`} className="block truncate" title={roleLabel}>
        {roleLabel}
      </span>,
    <StaffAdminStatusToggle
      key={`status-${admin.id}`}
      active={isStaffActive(admin.status)}
      disabled={actionId === admin.id || statusChangeLoading}
      label={`${isStaffActive(admin.status) ? 'Deactivate' : 'Activate'} ${admin.displayName ?? admin.email}`}
      onToggle={() => handleStatusToggle(admin)}
    />,
    <IconActionGroup key={`actions-${admin.id}`}>
      <IconActionButton
        icon="eye"
        label="View staff member"
        onClick={() => setViewUserId(admin.id)}
      />
      <IconActionButton
        icon="pencil"
        label="Change role"
        onClick={() => setModifyAdmin(admin)}
      />
    </IconActionGroup>,
    ];
  });

  const invitationRows = invitations.map((invitation) => [
    invitation.email,
    invitation.displayName || '—',
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
        onClick={() => setRevokeTargetId(invitation.id)}
        disabled={actionId === invitation.id}
      />
    </IconActionGroup>,
  ]);

  return (
    <>
      <DashboardPageShell
        title="User management"
        description="Panel operators (admins and scoped roles) plus pending invitations."
        loading={loading}
        error={error}
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Admins" value={String(admins.length)} />
            <StatCard label="Invitations" value={String(invitations.length)} />
          </div>

          <DashboardSectionTabs
            items={[...USER_MANAGEMENT_TABS]}
            activeId={activeTab}
            onChange={handleTabChange}
          />

          <Card>
            {activeTab === 'invitations' ? (
              <div className="flex justify-end border-b border-[hsl(var(--dashboard-sidebar-border))] px-4 py-3">
                <Button type="button" onClick={() => setShowSendModal(true)}>
                  + Send invitation
                </Button>
              </div>
            ) : null}

            {activeTab === 'admins' ? (
              admins.length === 0 ? (
                <EmptyState
                  variant="dashboard"
                  title="No panel operators"
                  description="Accepted invitations for admin and scoped roles appear here."
                  action={
                    <Button type="button" variant="secondary" onClick={() => handleTabChange('invitations')}>
                      View invitations
                    </Button>
                  }
                />
              ) : (
                <DataTable
                  columns={[...USER_MANAGEMENT_ADMIN_COLUMNS]}
                  rows={adminRows}
                  scrollable={false}
                  columnWidths={[...USER_MANAGEMENT_ADMIN_COLUMN_WIDTHS]}
                  columnClassNames={[...USER_MANAGEMENT_ADMIN_COLUMN_CLASSES]}
                />
              )
            ) : invitations.length === 0 ? (
              <EmptyState
                variant="dashboard"
                title="No pending invitations"
                description="Send an invitation to add a new admin."
                action={
                  <Button type="button" onClick={() => setShowSendModal(true)}>
                    + Send invitation
                  </Button>
                }
              />
            ) : (
              <DataTable
                columns={['Email', 'Name', 'Role', 'Expires', 'Actions']}
                rows={invitationRows}
              />
            )}
          </Card>
        </div>
      </DashboardPageShell>

      <SendAdminInvitationModal
        open={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSent={() => {
          void load();
          handleTabChange('invitations');
        }}
      />

      <StaffAdminViewModal
        open={viewUserId !== null}
        userId={viewUserId}
        onClose={() => setViewUserId(null)}
      />

      <StaffAdminModifyModal
        open={modifyAdmin !== null}
        admin={modifyAdmin}
        loading={modifyLoading}
        onSubmit={(payload) => void handleModifySubmit(payload)}
        onClose={() => setModifyAdmin(null)}
      />

      <StaffAdminStatusChangeModal
        open={statusChange !== null}
        userLabel={statusChange?.admin.displayName?.trim() || statusChange?.admin.email || ''}
        userEmail={statusChange?.admin.email ?? ''}
        nextStatus={statusChange?.nextStatus ?? 'inactive'}
        loading={statusChangeLoading}
        onSubmit={(payload) => void handleStatusChangeSubmit(payload)}
        onClose={() => setStatusChange(null)}
      />

      <ConfirmDialog
        open={revokeTargetId != null}
        title="Revoke invitation?"
        message="The invitation link will stop working immediately. The recipient will need a new invitation to join."
        confirmLabel="Revoke invitation"
        tone="danger"
        loading={revokeTargetId != null && actionId === revokeTargetId}
        onConfirm={() => {
          if (revokeTargetId) void handleRevoke(revokeTargetId);
        }}
        onCancel={() => {
          if (actionId == null) setRevokeTargetId(null);
        }}
      />
    </>
  );
}

/** @deprecated Use SuperAdminUserManagementPage */
export const SuperAdminOperatorsPage = SuperAdminUserManagementPage;
