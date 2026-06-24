'use client';

import { useEffect, useState } from 'react';

import { Button, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useToast } from '@community-marketplace/ui';

import { adminService } from '@/services/admin.service';

export function NotificationsPanel() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Array<Record<string, unknown>>>([]);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [targetRole, setTargetRole] = useState('SELLER');

  useEffect(() => {
    void adminService.getNotificationTemplates().then((data) => {
      const rows = Array.isArray(data) ? data : (data as { data?: unknown[] }).data ?? [];
      setTemplates(rows as Array<Record<string, unknown>>);
    });
  }, []);

  async function sendBroadcast() {
    try {
      await adminService.broadcastNotification({
        title: broadcastTitle,
        body: broadcastBody,
        targetRole,
        channels: ['in_app', 'push'],
      });
      toast({ title: 'Broadcast sent', variant: 'success' });
      setBroadcastTitle('');
      setBroadcastBody('');
    } catch {
      toast({ title: 'Broadcast failed', variant: 'error' });
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border p-4">
        <h2 className="font-medium">Broadcast notification</h2>
        <div className="mt-4 grid gap-3 max-w-lg">
          <Input placeholder="Title" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} />
          <Input placeholder="Message" value={broadcastBody} onChange={(e) => setBroadcastBody(e.target.value)} />
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          >
            <option value="SELLER">All sellers</option>
            <option value="BUYER">All buyers</option>
            <option value="ADMIN">All admins</option>
          </select>
          <Button onClick={() => void sendBroadcast()}>Send broadcast</Button>
        </div>
      </section>
      <section>
        <h2 className="mb-4 font-medium">Templates</h2>
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Version</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={String(t.id)}>
                  <TableCell>{String(t.key)}</TableCell>
                  <TableCell>{String(t.channel)}</TableCell>
                  <TableCell>{String(t.version ?? 1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
