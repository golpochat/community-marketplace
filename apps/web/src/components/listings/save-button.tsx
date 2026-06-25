'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button } from '@community-marketplace/ui';

import { useAuth } from '@/hooks/use-auth';
import { buyerService } from '@/services/marketplace.service';

interface SaveButtonProps {
  listingId: string;
  initialSaved?: boolean;
  size?: 'default' | 'sm' | 'icon';
}

export function SaveButton({ listingId, initialSaved = false, size = 'default' }: SaveButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = isAuthenticated && user?.role === 'BUYER';

  async function handleToggle() {
    if (!canSave) return;
    setLoading(true);
    setError(null);
    try {
      if (saved) {
        await buyerService.removeFavorite(listingId);
        setSaved(false);
      } else {
        await buyerService.addFavorite(listingId);
        setSaved(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update favorite');
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <Link href={`/auth/login?redirect=/listings/${listingId}`}>
        <Button variant="secondary" size={size === 'icon' ? 'sm' : size}>
          Save
        </Button>
      </Link>
    );
  }

  if (user?.role !== 'BUYER') {
    return null;
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        variant="secondary"
        size={size === 'icon' ? 'sm' : size}
        onClick={() => void handleToggle()}
        disabled={loading}
      >
        {loading ? 'Saving…' : saved ? 'Saved ♥' : 'Save'}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
