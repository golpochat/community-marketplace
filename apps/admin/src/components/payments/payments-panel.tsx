'use client';

import { useEffect, useState } from 'react';

import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useToast } from '@community-marketplace/ui';
import { formatCurrency } from '@community-marketplace/utils';

import { adminService } from '@/services/admin.service';

export function PaymentsPanel() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Array<Record<string, unknown>>>([]);
  const [refunds, setRefunds] = useState<Array<Record<string, unknown>>>([]);
  const [tab, setTab] = useState<'payments' | 'refunds'>('payments');

  useEffect(() => {
    void adminService.getPayments().then((data) => {
      const rows = (data as { data?: unknown[] }).data ?? (Array.isArray(data) ? data : []);
      setPayments(rows as Array<Record<string, unknown>>);
    });
    void adminService.getPendingRefunds().then((data) => {
      const rows = (data as { data?: unknown[] }).data ?? (Array.isArray(data) ? data : []);
      setRefunds(rows as Array<Record<string, unknown>>);
    });
  }, []);

  async function approveRefund(refundId: string) {
    try {
      await adminService.approveRefund({ refundId, approved: true });
      setRefunds((prev) => prev.filter((r) => r.id !== refundId));
      toast({ title: 'Refund approved', variant: 'success' });
    } catch {
      toast({ title: 'Failed to approve refund', variant: 'error' });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={tab === 'payments' ? 'default' : 'outline'} onClick={() => setTab('payments')}>
          Payments
        </Button>
        <Button variant={tab === 'refunds' ? 'default' : 'outline'} onClick={() => setTab('refunds')}>
          Pending refunds ({refunds.length})
        </Button>
      </div>
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              {tab === 'refunds' && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(tab === 'payments' ? payments : refunds).map((row) => (
              <TableRow key={String(row.id)}>
                <TableCell className="font-mono text-xs">{String(row.id).slice(0, 8)}…</TableCell>
                <TableCell>{formatCurrency(Number(row.amount ?? 0))}</TableCell>
                <TableCell>
                  <Badge>{String(row.status ?? 'unknown')}</Badge>
                </TableCell>
                {tab === 'refunds' && (
                  <TableCell>
                    <Button size="sm" onClick={() => void approveRefund(String(row.id))}>
                      Approve
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
