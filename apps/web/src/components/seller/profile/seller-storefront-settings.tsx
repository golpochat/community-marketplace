'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import type {
  SellerStore,
  SellerStoreLimits,
  StoreContactSettings,
  StoreOpeningHours,
  StorePolicy,
} from '@community-marketplace/types';
import { Button, Input, Label, useAppFeedback } from '@community-marketplace/ui';
import { Card } from '@community-marketplace/ui-dashboard';

import { DashboardSectionTabs } from '@/components/dashboard/dashboard-section-tabs';
import { StoreMarketingHub } from '@/components/seller/marketing-hub/store-marketing-hub';
import { formatStoreLimits } from '@/hooks/use-seller-store-data';
import { getPublicStorefrontPath } from '@/lib/storefront-path';
import { sellerService } from '@/services/marketplace.service';

import { SellerStoreSlotPanel } from './seller-store-slot-panel';
import {
  mergeStoreContact,
  mergeStoreOpeningHours,
  mergeStorePolicies,
  StorePublicDetailsForm,
} from './store-public-details-form';
import { StoreBannerUpload } from './store-banner-upload';
import { StoreLogoUpload } from './store-logo-upload';

const TEXTAREA_CLASSES =
  'flex min-h-[5rem] w-full resize-y rounded-md border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))] placeholder:text-[hsl(var(--dashboard-sidebar-muted))] focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))]';

const TAB_LABEL_MAX = 16;

interface SellerStorefrontSettingsProps {
  stores: SellerStore[];
  limits: SellerStoreLimits | null;
  onSaved?: () => void;
}

function pickDefaultStoreId(stores: SellerStore[]): string | null {
  if (!stores.length) return null;
  return stores.find((store) => store.isPrimary)?.id ?? stores[0]?.id ?? null;
}

function storeTabLabel(store: SellerStore): string {
  const name = store.name.trim();
  if (name.length <= TAB_LABEL_MAX) return name;
  return `${name.slice(0, TAB_LABEL_MAX - 1)}…`;
}

export function SellerStorefrontSettings({
  stores: initialStores,
  limits,
  onSaved,
}: SellerStorefrontSettingsProps) {
  const searchParams = useSearchParams();
  const feedback = useAppFeedback();
  const storeIdFromUrl = searchParams.get('storeId');

  const [stores, setStores] = useState(initialStores);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(() =>
    pickDefaultStoreId(initialStores),
  );
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState<StoreContactSettings>(mergeStoreContact());
  const [openingHours, setOpeningHours] = useState<StoreOpeningHours>(mergeStoreOpeningHours());
  const [policies, setPolicies] = useState<StorePolicy>(mergeStorePolicies());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createLocation, setCreateLocation] = useState('');
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'profile' | 'details' | 'promote'>('profile');

  const activeStore = useMemo(
    () => stores.find((store) => store.id === activeStoreId) ?? null,
    [activeStoreId, stores],
  );

  const storeTabs = useMemo(
    () => stores.map((store) => ({ id: store.id, label: storeTabLabel(store) })),
    [stores],
  );

  useEffect(() => {
    setStores(initialStores);
    setActiveStoreId((current) => {
      if (storeIdFromUrl && initialStores.some((store) => store.id === storeIdFromUrl)) {
        return storeIdFromUrl;
      }
      if (current && initialStores.some((store) => store.id === current)) {
        return current;
      }
      return pickDefaultStoreId(initialStores);
    });
  }, [initialStores, storeIdFromUrl]);

  useEffect(() => {
    if (activeStore) {
      setName(activeStore.name ?? '');
      setDescription(activeStore.description ?? '');
      setLocation(activeStore.location ?? '');
      setContact(mergeStoreContact(activeStore.contact));
      setOpeningHours(mergeStoreOpeningHours(activeStore.openingHours));
      setPolicies(mergeStorePolicies(activeStore.policies));
      setTab('profile');
    }
  }, [activeStore]);

  const selectStore = useCallback((storeId: string) => {
    setActiveStoreId(storeId);
    setShowCreateForm(false);
    setError(null);
  }, []);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    setError(null);
    try {
      const created = await sellerService.createStore({
        name: createName.trim(),
        description: createDescription.trim() || undefined,
        location: createLocation.trim() || undefined,
      });
      setStores((current) => [...current, created]);
      setActiveStoreId(created.id);
      setShowCreateForm(false);
      setCreateName('');
      setCreateDescription('');
      setCreateLocation('');
      feedback.success('Storefront created');
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create storefront');
    } finally {
      setCreating(false);
    }
  }, [createDescription, createLocation, createName, feedback, onSaved]);

  const handleSave = useCallback(async () => {
    if (!activeStore) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await sellerService.updateStore(activeStore.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        contact: {
          ...contact,
          phone: contact.phone?.trim() || undefined,
          email: contact.email?.trim() || undefined,
          addressLine: contact.addressLine?.trim() || undefined,
          website: contact.website?.trim() || undefined,
        },
        openingHours,
        policies: {
          returns: policies.returns?.trim() || undefined,
          shipping: policies.shipping?.trim() || undefined,
          responseTime: policies.responseTime?.trim() || undefined,
        },
      });
      setStores((current) => current.map((store) => (store.id === updated.id ? updated : store)));
      feedback.success('Storefront updated');
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save storefront');
    } finally {
      setSaving(false);
    }
  }, [activeStore, contact, description, feedback, location, name, openingHours, policies, onSaved]);

  const limitsLabel = formatStoreLimits(limits);
  const canAddStore = limits?.canCreateStore === true;
  const tabItems = useMemo(
    () => [
      { id: 'profile', label: 'Profile' },
      { id: 'details', label: 'Buyer details' },
      { id: 'promote', label: 'Promote' },
    ],
    [],
  );

  if (!stores.length) {
    return (
      <div className="max-w-2xl space-y-6">
        {error && <p className="text-sm text-destructive">{error}</p>}
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
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Hijabi Gift"
              />
            </div>
            <div>
              <Label htmlFor="create-store-description">Store description</Label>
              <textarea
                id="create-store-description"
                rows={3}
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="What do you sell?"
                className={TEXTAREA_CLASSES}
              />
            </div>
            <div>
              <Label htmlFor="create-store-location">Store location</Label>
              <Input
                id="create-store-location"
                value={createLocation}
                onChange={(e) => setCreateLocation(e.target.value)}
                placeholder="e.g. Dublin"
              />
            </div>
            <Button
              type="button"
              disabled={creating || !createName.trim() || limits?.canCreateStore === false}
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

  return (
    <div className="max-w-2xl space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card title="Storefronts">
        {limitsLabel && (
          <p className="mb-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">{limitsLabel}</p>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <DashboardSectionTabs
            items={storeTabs}
            activeId={showCreateForm ? '' : (activeStoreId ?? '')}
            onChange={selectStore}
            variant="nested"
            className="min-w-0 flex-1"
          />
          {canAddStore && (
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => {
                setShowCreateForm(true);
                setError(null);
              }}
            >
              + Add
            </Button>
          )}
        </div>

        <div className="mt-6 border-t border-[hsl(var(--dashboard-sidebar-border))] pt-6">
          {showCreateForm && canAddStore ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">New storefront</p>
              <div>
                <Label htmlFor="add-store-name">Store name</Label>
                <Input
                  id="add-store-name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Second brand"
                />
              </div>
              <div>
                <Label htmlFor="add-store-description">Store description</Label>
                <textarea
                  id="add-store-description"
                  rows={3}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className={TEXTAREA_CLASSES}
                />
              </div>
              <div>
                <Label htmlFor="add-store-location">Store location</Label>
                <Input
                  id="add-store-location"
                  value={createLocation}
                  onChange={(e) => setCreateLocation(e.target.value)}
                  placeholder="e.g. Dublin"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={creating || !createName.trim()}
                  onClick={() => void handleCreate()}
                >
                  {creating ? 'Creating…' : 'Create storefront'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={creating}
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateName('');
                    setCreateDescription('');
                    setCreateLocation('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            activeStore && (
              <div className="space-y-6 pb-24">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                    {activeStore.isPrimary ? 'Primary storefront' : 'Storefront'}
                    <span className="mx-1.5 text-[hsl(var(--dashboard-sidebar-muted))]">·</span>
                    <span className="text-[hsl(var(--dashboard-main-fg))]">{activeStore.name}</span>
                  </p>
                  <Link
                    href={getPublicStorefrontPath(activeStore.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-sm font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
                  >
                    View public storefront →
                  </Link>
                </div>

                <DashboardSectionTabs
                  items={tabItems}
                  activeId={tab}
                  onChange={(next) => setTab(next as typeof tab)}
                  variant="nested"
                />

                {tab === 'profile' && (
                  <div className="space-y-4">
                    <StoreBannerUpload
                      bannerUrl={activeStore.bannerUrl}
                      storeId={activeStore.id}
                      onUpdated={(bannerUrl) => {
                        setStores((current) =>
                          current.map((store) =>
                            store.id === activeStore.id ? { ...store, bannerUrl } : store,
                          ),
                        );
                        setError(null);
                        feedback.success('Storefront banner updated');
                        onSaved?.();
                      }}
                    />

                    <StoreLogoUpload
                      logoUrl={activeStore.logoUrl}
                      storeName={activeStore.name}
                      storeId={activeStore.id}
                      onUpdated={(logoUrl) => {
                        setStores((current) =>
                          current.map((store) =>
                            store.id === activeStore.id ? { ...store, logoUrl } : store,
                          ),
                        );
                        setError(null);
                        feedback.success('Store logo updated');
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
                      Public URL: /store/{activeStore.slug}
                    </p>
                  </div>
                )}

                {tab === 'details' && (
                  <div className="space-y-4">
                    <StorePublicDetailsForm
                      contact={contact}
                      openingHours={openingHours}
                      policies={policies}
                      onContactChange={setContact}
                      onOpeningHoursChange={setOpeningHours}
                      onPoliciesChange={setPolicies}
                    />
                  </div>
                )}

                {tab === 'promote' && (
                  <div className="space-y-4">
                    <StoreMarketingHub
                      store={activeStore}
                      name={name}
                      description={description}
                      location={location}
                      onAcceptName={setName}
                      onAcceptDescription={setDescription}
                      onBannerApplied={(bannerUrl) => {
                        setStores((current) =>
                          current.map((store) =>
                            store.id === activeStore.id ? { ...store, bannerUrl } : store,
                          ),
                        );
                        feedback.success('Shop banner applied to storefront');
                        onSaved?.();
                      }}
                    />
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {limits?.blockReason && !canAddStore && (
          <p className="mt-4 text-sm text-amber-700">{limits.blockReason}</p>
        )}
      </Card>

      {limits && !canAddStore && limits.storeCount >= limits.storeSlotLimit && (
        <SellerStoreSlotPanel onUpdated={() => onSaved?.()} />
      )}

      {activeStore && !showCreateForm ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[hsl(var(--dashboard-sidebar-border))] bg-background/90 backdrop-blur-lg">
          <div className="mx-auto flex max-w-2xl items-center justify-end gap-3 px-4 py-3">
            <Button
              type="button"
              variant="outline"
              disabled={saving || !name.trim()}
              onClick={() => void handleSave()}
            >
              {saving ? 'Saving…' : 'Save storefront'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
