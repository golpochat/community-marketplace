'use client';

import { useState } from 'react';

import { Badge, Button, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useToast } from '@community-marketplace/ui';

import { PermissionGate } from '@/components/layout/permission-gate';
import { PERMISSIONS } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { adminService } from '@/services/admin.service';

interface Listing {
  id: string;
  title: string;
  price: number;
  status: string;
  location?: string;
  locationLabel?: string;
}

interface Props {
  listings: Listing[];
}

export function ListingsManagement({ listings: initial }: Props) {
  const { toast } = useToast();
  const [listings, setListings] = useState(initial);
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = listings.filter((l) => !statusFilter || l.status === statusFilter);

  async function banListing(id: string) {
    try {
      await adminService.banListing(id, { moderationNotes: 'Banned by admin' });
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'banned' } : l)));
      toast({ title: 'Listing banned', variant: 'success' });
    } catch {
      toast({ title: 'Ban failed', variant: 'error' });
    }
  }

  async function unbanListing(id: string) {
    try {
      await adminService.unbanListing(id);
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'active' } : l)));
      toast({ title: 'Listing unbanned', variant: 'success' });
    } catch {
      toast({ title: 'Unban failed', variant: 'error' });
    }
  }

  return (
    <div className="space-y-4">
      <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-xs">
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="draft">Draft</option>
        <option value="sold">Sold</option>
        <option value="banned">Banned</option>
      </Select>
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell>{listing.title}</TableCell>
                <TableCell>{formatCurrency(listing.price)}</TableCell>
                <TableCell>{listing.locationLabel ?? listing.location ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={listing.status === 'banned' ? 'destructive' : 'secondary'}>
                    {listing.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <PermissionGate permission={PERMISSIONS.BAN_LISTING}>
                    {listing.status === 'banned' ? (
                      <Button size="sm" variant="outline" onClick={() => void unbanListing(listing.id)}>
                        Unban
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => void banListing(listing.id)}>
                        Ban
                      </Button>
                    )}
                  </PermissionGate>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
