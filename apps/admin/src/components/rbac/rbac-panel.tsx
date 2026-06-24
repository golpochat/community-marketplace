'use client';

import { useEffect, useState } from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@community-marketplace/ui';

import { adminService } from '@/services/admin.service';

export function RbacPanel() {
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});

  useEffect(() => {
    void adminService.getRoleMatrix().then((data) => setMatrix(data as Record<string, string[]>));
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Role permission matrix (read-only overview). Use API or future UI to modify.
      </p>
      {Object.entries(matrix).map(([role, perms]) => (
        <div key={role} className="rounded-xl border p-4">
          <h3 className="font-medium">{role}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{perms.length} permissions</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {perms.slice(0, 12).map((p) => (
              <span key={p} className="rounded bg-muted px-2 py-0.5 text-xs">
                {p}
              </span>
            ))}
            {perms.length > 12 && (
              <span className="text-xs text-muted-foreground">+{perms.length - 12} more</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminsPanel() {
  const [admins, setAdmins] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    void adminService.getAdmins().then((data) => {
      const rows = (data as { data?: unknown[] }).data ?? [];
      setAdmins(rows as Array<Record<string, unknown>>);
    });
  }, []);

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admins.map((a) => (
            <TableRow key={String(a.id)}>
              <TableCell>{String(a.email)}</TableCell>
              <TableCell>{String(a.role)}</TableCell>
              <TableCell>{String(a.status ?? 'active')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
