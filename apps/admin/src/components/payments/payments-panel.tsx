'use client';

import { useCallback, useEffect, useState } from 'react';

import type { PaymentRefund } from '@community-marketplace/types';
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from '@community-marketplace/ui';
import { formatCurrency } from '@community-marketplace/utils';

import { adminService } from '@/services/admin.service';

export function PaymentsPanel() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Array<Record<string, unknown>>>([]);
  const [refunds, setRefunds] = useState<PaymentRefund[]>([]);
  const [tab, setTab] = useState<'payments' | 'refunds'>('payments');
  const [actingRefundId, setActingRefundId] = useState<string | null>(null);

  const loadRefunds = useCallback(async () => {
    const data = await adminService.getPendingRefunds();
    const rows = (data as { data?: PaymentRefund[] }).data ?? (Array.isArray(data) ? data : []);
    setRefunds(rows as PaymentRefund[]);
  }, []);

  useEffect(() => {
    void adminService.getPayments().then((data) => {
      const rows = (data as { data?: unknown[] }).data ?? (Array.isArray(data) ? data : []);
      setPayments(rows as Array<Record<string, unknown>>);
    });
    void loadRefunds();
  }, [loadRefunds]);

  async function resolveRefund(refundId: string, approve: boolean) {
    let reason: string | undefined;
    if (!approve) {
      const input = window.prompt('Reason for rejection (optional):');
      if (input === null) return;
      reason = input.trim() || undefined;
    }

    setActingRefundId(refundId);
    try {
      await adminService.approveRefund({ refundId, approve, reason });
      setRefunds((prev) => prev.filter((r) => r.id !== refundId));
      toast({
        title: approve ? 'Refund approved' : 'Refund rejected',
        description: approve
          ? 'Stripe refund initiated and payment marked refunded.'
          : 'The buyer has not been charged back.',
        variant: 'success',
      });
    } catch {
      toast({
        title: approve ? 'Failed to approve refund' : 'Failed to reject refund',
        variant: 'error',
      });
    } finally {
      setActingRefundId(null);
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
              {tab === 'refunds' && <TableHead>Payment</TableHead>}
              <TableHead>Amount</TableHead>
              {tab === 'refunds' && <TableHead>Reason</TableHead>}
              <TableHead>Status</TableHead>
              {tab === 'refunds' && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(tab === 'payments' ? payments : refunds).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={tab === 'refunds' ? 6 : 3}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  {tab === 'payments' ? 'No payments found.' : 'No pending refund requests.'}
                </TableCell>
              </TableRow>
            )}
            {tab === 'payments' &&
              payments.map((row) => (
                <TableRow key={String(row.id)}>
                  <TableCell className="font-mono text-xs">{String(row.id).slice(0, 8)}…</TableCell>
                  <TableCell>{formatCurrency(Number(row.amount ?? 0))}</TableCell>
                  <TableCell>
                    <Badge>{String(row.status ?? 'unknown')}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            {tab === 'refunds' &&
              refunds.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.id.slice(0, 8)}…</TableCell>
                  <TableCell className="font-mono text-xs">{row.paymentId.slice(0, 8)}…</TableCell>
                  <TableCell>{formatCurrency(row.amount)}</TableCell>
                  <TableCell className="max-w-[12rem] truncate text-sm text-muted-foreground">
                    {row.reason ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge>{row.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={actingRefundId === row.id}
                        onClick={() => void resolveRefund(row.id, true)}
                      >
                        {actingRefundId === row.id ? 'Working…' : 'Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actingRefundId === row.id}
                        onClick={() => void resolveRefund(row.id, false)}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
