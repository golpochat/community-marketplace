'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import type { UserProfile } from '@community-marketplace/types';
import { Button, Input, Label } from '@community-marketplace/ui';
import { Card } from '@community-marketplace/ui-dashboard';

import { getPublicStorefrontPath } from '@/lib/storefront-path';
import { sellerService } from '@/services/marketplace.service';
import { useAuthStore } from '@/store/auth.store';

import { StoreBannerUpload } from './store-banner-upload';
import { StoreLogoUpload } from './store-logo-upload';

interface SellerStorefrontSettingsProps {
  profile: UserProfile | null;
  onSaved?: () => void;
}

export function SellerStorefrontSettings({ profile: initialProfile, onSaved }: SellerStorefrontSettingsProps) {
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProfile(initialProfile);
    if (initialProfile) {
      setDisplayName(initialProfile.displayName ?? '');
      setBio(initialProfile.bio ?? '');
      setLocationLabel(initialProfile.location?.label ?? '');
    }
  }, [initialProfile]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await sellerService.updateProfile({
        displayName,
        bio,
        location: locationLabel.trim() ? { label: locationLabel.trim() } : undefined,
      });
      setProfile(updated);
      useAuthStore.getState().updateUser({
        displayName: updated.displayName,
        avatarUrl: updated.avatarUrl,
      });
      setMessage('Storefront updated.');
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save storefront');
    } finally {
      setSaving(false);
    }
  }, [bio, displayName, locationLabel, onSaved]);

  if (!profile) {
    return <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading storefront…</p>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <Card title="Public storefront">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            This is what buyers see on your public store page.
          </p>
          <Link
            href={getPublicStorefrontPath(profile.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
          >
            View public storefront →
          </Link>
        </div>

        <div className="space-y-4">
          <StoreBannerUpload
            bannerUrl={profile.storeBannerUrl}
            onUpdated={(storeBannerUrl) => {
              setProfile((current) => (current ? { ...current, storeBannerUrl } : current));
              setError(null);
              setMessage('Storefront banner updated.');
              onSaved?.();
            }}
          />

          <StoreLogoUpload
            avatarUrl={profile.avatarUrl}
            displayName={profile.displayName}
            onUpdated={(avatarUrl) => {
              setProfile((current) => (current ? { ...current, avatarUrl } : current));
              setError(null);
              setMessage('Store logo updated.');
              onSaved?.();
            }}
          />

          <div>
            <Label htmlFor="storefront-name">Store name</Label>
            <Input
              id="storefront-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="storefront-bio">Store description</Label>
            <Input id="storefront-bio" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="storefront-location">Store location</Label>
            <Input
              id="storefront-location"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              placeholder="e.g. Dublin"
            />
          </div>

          <Button type="button" disabled={saving} onClick={() => void handleSave()}>
            {saving ? 'Saving…' : 'Save storefront'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
