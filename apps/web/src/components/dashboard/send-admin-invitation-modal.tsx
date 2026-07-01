'use client';

import { useEffect, useState } from 'react';

import { Button, Input, Label } from '@community-marketplace/ui';

import {
  adminService,
  type AdminInviteableRoleRow,
  type CreateAdminInvitationInput,
} from '@/services/admin.service';

interface SendAdminInvitationModalProps {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}

export function SendAdminInvitationModal({ open, onClose, onSent }: SendAdminInvitationModalProps) {
  const [roles, setRoles] = useState<AdminInviteableRoleRow[]>([]);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoadingRoles(true);
    void adminService
      .listInviteableRoles()
      .then((items) => {
        setRoles(items);
        setRoleId((current) => current || items[0]?.id || '');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingRoles(false));
  }, [open]);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setDisplayName('');
      setRoleId('');
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: CreateAdminInvitationInput = {
        email: email.trim(),
        displayName: displayName.trim(),
        roleId,
      };
      await adminService.createAdminInvitation(payload);
      onSent();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] shadow-xl">
        <div className="flex items-center justify-between border-b border-[hsl(var(--dashboard-sidebar-border))] px-6 py-4">
          <h3 className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]">Send invitation</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[hsl(var(--dashboard-sidebar-muted))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.5)] hover:text-[hsl(var(--dashboard-main-fg))]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-name">Name</Label>
            <Input
              id="invite-name"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              required
              disabled={loadingRoles || roles.length === 0}
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading || loadingRoles || !roleId}>
              {loading ? 'Sending…' : 'Send'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
