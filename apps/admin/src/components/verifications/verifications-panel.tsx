'use client';

import { useState } from 'react';

import { Badge, Button, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useToast } from '@community-marketplace/ui';

import { adminService } from '@/services/admin.service';

interface Verification {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  user?: { email: string; displayName?: string };
}

interface Props {
  initial: Verification[];
}

export function VerificationsPanel({ initial }: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  async function approve(id: string) {
    try {
      await adminService.approveVerification(id);
      setItems((prev) => prev.filter((v) => v.id !== id));
      toast({ title: 'Verification approved', variant: 'success' });
    } catch {
      toast({ title: 'Approval failed', variant: 'error' });
    }
  }

  async function reject(id: string) {
    try {
      await adminService.rejectVerification(id, { reason: rejectReason || 'Rejected by admin' });
      setItems((prev) => prev.filter((v) => v.id !== id));
      toast({ title: 'Verification rejected', variant: 'success' });
      setRejectId(null);
      setRejectReason('');
    } catch {
      toast({ title: 'Rejection failed', variant: 'error' });
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seller</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No pending verifications
                </TableCell>
              </TableRow>
            ) : (
              items.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.user?.email ?? v.userId}</TableCell>
                  <TableCell>{new Date(v.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge>{v.status}</Badge>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" onClick={() => void approve(v.id)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectId(v.id)}>
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {rejectId && (
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium">Rejection reason</p>
          <Input
            className="mt-2"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection"
          />
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="destructive" onClick={() => void reject(rejectId)}>
              Confirm reject
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRejectId(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
