'use client';

import { useState } from 'react';

import type { UserProfile } from '@community-marketplace/types';
import { PERMISSIONS } from '@community-marketplace/types';
import {
  Badge,
  Button,
  Dialog,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from '@community-marketplace/ui';

import { PermissionGate } from '@/components/layout/permission-gate';
import { adminService } from '@/services/admin.service';

interface Props {
  initialUsers: UserProfile[];
}

export function UsersManagement({ initialUsers }: Props) {
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [filter, setFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [suspendTarget, setSuspendTarget] = useState<UserProfile | null>(null);
  const [reason, setReason] = useState('');

  const filtered = users.filter((u) => {
    const matchSearch =
      !filter ||
      u.email.toLowerCase().includes(filter.toLowerCase()) ||
      (u.displayName ?? '').toLowerCase().includes(filter.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  async function handleSuspend() {
    if (!suspendTarget) return;
    try {
      await adminService.suspendUser({ userId: suspendTarget.id, reason });
      setUsers((prev) =>
        prev.map((u) => (u.id === suspendTarget.id ? { ...u, status: 'suspended' as const } : u)),
      );
      toast({ title: 'User suspended', variant: 'success' });
    } catch {
      toast({ title: 'Failed to suspend user', variant: 'error' });
    } finally {
      setSuspendTarget(null);
      setReason('');
    }
  }

  async function handleUnsuspend(userId: string) {
    try {
      await adminService.unsuspendUser(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'active' as const } : u)),
      );
      toast({ title: 'User unsuspended', variant: 'success' });
    } catch {
      toast({ title: 'Failed to unsuspend', variant: 'error' });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search users…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="BUYER">Buyer</option>
          <option value="SELLER">Seller</option>
          <option value="ADMIN">Admin</option>
        </Select>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.displayName ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{user.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <PermissionGate permission={PERMISSIONS.SUSPEND_USER}>
                    {user.status === 'active' ? (
                      <Button size="sm" variant="outline" onClick={() => setSuspendTarget(user)}>
                        Suspend
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => void handleUnsuspend(user.id)}>
                        Unsuspend
                      </Button>
                    )}
                  </PermissionGate>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={Boolean(suspendTarget)}
        onOpenChange={(open) => !open && setSuspendTarget(null)}
        title="Suspend user"
        description={`Suspend ${suspendTarget?.email}?`}
        confirmLabel="Suspend"
        variant="destructive"
        onConfirm={() => void handleSuspend()}
      >
        <Input
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Dialog>
    </div>
  );
}
