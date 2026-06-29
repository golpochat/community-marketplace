'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import type { SellerStore, SellerStoreLimits } from '@community-marketplace/types';
import { Button, Input, Label } from '@community-marketplace/ui';
import { Card } from '@community-marketplace/ui-dashboard';

import { formatStoreLimits } from '@/hooks/use-seller-store-data';
import { getPublicStorefrontPath } from '@/lib/storefront-path';
import { sellerService } from '@/services/marketplace.service';

import { SellerStoreSlotPanel } from './seller-store-slot-panel';
import { StoreBannerUpload } from './store-banner-upload';
import { StoreLogoUpload } from './store-logo-upload';

const TEXTAREA_CLASSES =
  'flex min-h-[5rem] w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))]';

interface SellerStorefrontSettingsProps {
  store: SellerStore | null;
  limits: SellerStoreLimits | null;
  onSaved?: () => void;
}

export function SellerStorefrontSettings({
  store: initialStore,
  limits,
  onSaved,
}: SellerStorefrontSettingsProps) {
  const [store, setStore] = useState<SellerStore | null>(initialStore);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStore(initialStore);
    if (initialStore) {
      setName(initialStore.name ?? '');
      setDescription(initialStore.description ?? '');
      setLocation(initialStore.location ?? '');
    }
  }, [initialStore]);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    setError(null);
    setMessage(null);
    try {
      const created = await sellerService.createStore({
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
      });
      setStore(created);
      setMessage('Storefront created.');
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create storefront');
    } finally {
      setCreating(false);
    }
  }, [description, location, name, onSaved]);

  const handleSave = useCallback(async () => {
    if (!store) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await sellerService.updateStore(store.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
      });
      setStore(updated);
      setMessage('Storefront updated.');
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save storefront');
    } finally {
      setSaving(false);
    }
  }, [description, location, name, onSaved, store]);

  if (!store) {
    return (
      <div className="max-w-2xl space-y-6">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        <Card title="Create your storefront">
          <p className="mb-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Your shop brand is separate from your login profile. Buyers see this name on your
            public store page.
          </p>
          {limits?.blockReason && !limits.canCreateStore && (
            <p className="mb-4 text-sm text-amber-700">{limits.blockReason}</p>
          )}
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-store-name">Store name</Label>
              <Input
                id="create-store-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Hijabi Gift"
              />
            </div>
            <div>
              <Label htmlFor="create-store-description">Store description</Label>
              <textarea
                id="create-store-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What do you sell?"
                className={TEXTAREA_CLASSES}
              />
            </div>
            <div>
              <Label htmlFor="create-store-location">Store location</Label>
              <Input
                id="create-store-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Dublin"
              />
            </div>
            <Button
              type="button"
              disabled={creating || !name.trim() || limits?.canCreateStore === false}
              onClick={() => void handleCreate()}
            >
              {creating ? 'Creating…' : 'Create storefront'}
            </Button>
          </div>
        </Card>
        {limits && !limits.canCreateStore && limits.requiresVerification === false && (
          <SellerStoreSlotPanel onUpdated={() => onSaved?.()} />
        )}
      </div>
    );
  }

  const limitsLabel = formatStoreLimits(limits);

  return (
    <div className="max-w-2xl space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <Card title="Public storefront">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            <p>This is what buyers see on your public store page.</p>
            {limitsLabel && <p className="mt-1">{limitsLabel}</p>}
          </div>
          <Link
            href={getPublicStorefrontPath(store.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
          >
            View public storefront →
          </Link>
        </div>

        <div className="space-y-4">
          <StoreBannerUpload
            bannerUrl={store.bannerUrl}
            storeId={store.id}
            onUpdated={(bannerUrl) => {
              setStore((current) => (current ? { ...current, bannerUrl } : current));
              setError(null);
              setMessage('Storefront banner updated.');
              onSaved?.();
            }}
          />

          <StoreLogoUpload
            logoUrl={store.logoUrl}
            storeName={store.name}
            storeId={store.id}
            onUpdated={(logoUrl) => {
              setStore((current) => (current ? { ...current, logoUrl } : current));
              setError(null);
              setMessage('Store logo updated.');
              onSaved?.();
            }}
          />

          <div>
            <Label htmlFor="storefront-name">Store name</Label>
            <Input
              id="storefront-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="storefront-bio">Store description</Label>
            <textarea
              id="storefront-bio"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={TEXTAREA_CLASSES}
            />
          </div>

          <div>
            <Label htmlFor="storefront-location">Store location</Label>
            <Input
              id="storefront-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Dublin"
            />
          </div>

          <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Public URL: /store/{store.slug}
          </p>

          <Button type="button" disabled={saving || !name.trim()} onClick={() => void handleSave()}>
            {saving ? 'Saving…' : 'Save storefront'}
          </Button>
        </div>
      </Card>

      {limits && !limits.canCreateStore && limits.storeCount >= limits.storeSlotLimit && (
        <SellerStoreSlotPanel onUpdated={() => onSaved?.()} />
      )}
    </div>
  );
}
