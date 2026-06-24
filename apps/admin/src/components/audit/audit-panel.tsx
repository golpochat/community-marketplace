'use client';

import { useEffect, useState } from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@community-marketplace/ui';

import { useAdminAuth } from '@/hooks/use-admin-auth';
import { adminService } from '@/services/admin.service';

interface AuditEntry {
  id: string;
  adminId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  createdAt?: string;
}

export function AuditPanel() {
  const { user } = useAdminAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    void adminService.getAuditLog(user?.role).then((data) => {
      const rows = Array.isArray(data) ? data : [];
      setEntries(rows as AuditEntry[]);
    });
  }, [user?.role]);

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No audit entries
              </TableCell>
            </TableRow>
          ) : (
            entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.action ?? '—'}</TableCell>
                <TableCell>
                  {e.targetType}/{e.targetId?.slice(0, 8)}
                </TableCell>
                <TableCell>{e.adminId?.slice(0, 8) ?? '—'}</TableCell>
                <TableCell>
                  {e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
