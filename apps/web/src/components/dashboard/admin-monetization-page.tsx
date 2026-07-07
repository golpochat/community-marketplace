'use client';

import { useCallback, useEffect, useState } from 'react';

import type { AdsSystemStatus, MonetizationSettings } from '@community-marketplace/types';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

import { AdminMonetizationAdvertising } from '@/components/dashboard/admin-monetization-advertising';
import { AdminMonetizationBuyerCashbackOverrides } from '@/components/dashboard/admin-monetization-buyer-cashback-overrides';
import { AdminMonetizationFeeOverrides } from '@/components/dashboard/admin-monetization-fee-overrides';
import { AdminMonetizationProductCatalog } from '@/components/dashboard/admin-monetization-product-catalog';
import { DashboardPageShell } from '@/components/dashboard/async-resource';
import { DashboardSectionTabs } from '@/components/dashboard/dashboard-section-tabs';
import { adsService } from '@/services/ads.service';
import { monetizationService } from '@/services/monetization.service';
import type { AdminServiceRole } from '@/services/admin.service';

interface AdminMonetizationPageProps {
  role: AdminServiceRole;
}

type MonetizationTab = 'advertising' | 'fees' | 'catalog';
type FeesSubTab = 'seller' | 'buyer';

const MONETIZATION_TABS: { id: MonetizationTab; label: string }[] = [
  { id: 'advertising', label: 'Advertising' },
  { id: 'fees', label: 'Platform fees & cashback' },
  { id: 'catalog', label: 'Listing promotions' },
];

const PAGE_TITLES: Record<MonetizationTab, string> = {
  advertising: 'Advertising',
  fees: 'Platform fees & cashback',
  catalog: 'Listing promotions',
};

const PAGE_DESCRIPTIONS: Record<MonetizationTab, string> = {
  advertising: 'Turn advertising modules on or off and review deploy flags.',
  fees: 'Platform fee defaults, cashback settings, and per-user overrides.',
  catalog: 'Manage listing boosts and featured placement products.',
};

const FEES_SUB_TABS: { id: FeesSubTab; label: string }[] = [
  { id: 'seller', label: 'Seller' },
  { id: 'buyer', label: 'Buyer' },
];

export function AdminMonetizationPage({ role }: AdminMonetizationPageProps) {
  const [settings, setSettings] = useState<MonetizationSettings | null>(null);
  const [adsSystem, setAdsSystem] = useState<AdsSystemStatus | null>(null);
  const [activeTab, setActiveTab] = useState<MonetizationTab>('catalog');
  const [feesSubTab, setFeesSubTab] = useState<FeesSubTab>('seller');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, adsStatus] = await Promise.all([
        monetizationService.getMonetizationSettings(role),
        adsService.getAdsSystemStatus(role),
      ]);
      setSettings(data);
      setAdsSystem(adsStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monetization settings');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSaveSellerSettings(event: React.FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await monetizationService.updateMonetizationSettings(role, {
        defaultPlatformFeePercent: settings.defaultPlatformFeePercent,
        verifiedSellerFeePercent: settings.verifiedSellerFeePercent,
      });
      setSettings(updated);
      setMessage('Seller fee settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBuyerSettings(event: React.FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await monetizationService.updateMonetizationSettings(role, {
        cashbackPercent: settings.cashbackPercent,
        coolingDays: settings.coolingDays,
        maxCashbackPerOrder: settings.maxCashbackPerOrder,
        maxCashbackPerMonth: settings.maxCashbackPerMonth,
        cashbackEnabled: settings.cashbackEnabled,
        cashbackMinOrderAmount: settings.cashbackMinOrderAmount,
      });
      setSettings(updated);
      setMessage('Buyer cashback settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAdvertising(event: React.FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await monetizationService.updateMonetizationSettings(role, {
        displayAdsEnabled: settings.displayAdsEnabled,
        boostsEnabled: settings.boostsEnabled,
        featuredEnabled: settings.featuredEnabled,
      });
      setSettings(updated);
      const adsStatus = await adsService.getAdsSystemStatus(role);
      setAdsSystem(adsStatus);
      setMessage('Module settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function refreshAdsSystemStatus() {
    try {
      const adsStatus = await adsService.getAdsSystemStatus(role);
      setAdsSystem(adsStatus);
    } catch {
      // Non-fatal — status panel stays on last known values
    }
  }

  function handlePanelError(panelError: string) {
    if (panelError) setError(panelError);
  }

  function handlePanelMessage(panelMessage: string) {
    setMessage(panelMessage);
    setError(null);
  }

  return (
    <>
      <DashboardPageShell
        title={PAGE_TITLES[activeTab]}
        description={PAGE_DESCRIPTIONS[activeTab]}
        loading={loading}
        error={error}
        empty={false}
      >
        {message && <p className="mb-4 text-sm text-green-700">{message}</p>}
        {settings && (
          <>
            <DashboardSectionTabs
              items={MONETIZATION_TABS}
              activeId={activeTab}
              onChange={(id) => setActiveTab(id as MonetizationTab)}
            />

            {activeTab === 'advertising' && (
              <AdminMonetizationAdvertising
                settings={settings}
                adsSystem={adsSystem}
                saving={saving}
                onSettingsChange={setSettings}
                onSave={handleSaveAdvertising}
                onGoToCatalog={() => {
                  setActiveTab('catalog');
                  void refreshAdsSystemStatus();
                }}
              />
            )}

            {activeTab === 'fees' && (
              <div className="space-y-6">
                <DashboardSectionTabs
                  items={FEES_SUB_TABS}
                  activeId={feesSubTab}
                  onChange={(id) => setFeesSubTab(id as FeesSubTab)}
                  variant="nested"
                />

                {feesSubTab === 'seller' && (
                  <>
                    <DashboardCard title="Seller platform fees">
                      <form
                        onSubmit={(e) => void handleSaveSellerSettings(e)}
                        className="grid gap-4 sm:grid-cols-2"
                      >
                        <label className="text-sm">
                          <span className="mb-1 block font-medium text-[hsl(var(--dashboard-main-fg))]">
                            Default platform fee %
                          </span>
                          <input
                            type="number"
                            min={3}
                            max={15}
                            step={0.1}
                            value={settings.defaultPlatformFeePercent}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                defaultPlatformFeePercent: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
                          />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block font-medium text-[hsl(var(--dashboard-main-fg))]">
                            Verified seller fee %
                          </span>
                          <input
                            type="number"
                            min={3}
                            max={15}
                            step={0.1}
                            value={settings.verifiedSellerFeePercent}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                verifiedSellerFeePercent: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2 sm:w-fit"
                        >
                          {saving ? 'Saving…' : 'Save seller fee defaults'}
                        </button>
                      </form>
                    </DashboardCard>

                    <AdminMonetizationFeeOverrides
                      role={role}
                      onMessage={handlePanelMessage}
                      onError={handlePanelError}
                    />
                  </>
                )}

                {feesSubTab === 'buyer' && (
                  <>
                    <DashboardCard title="Buyer cashback defaults">
                      <p className="mb-4 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                        Policy is fixed in code: card payments only, {settings.coolingDays}-day
                        cooling period after purchase, no cashback on refunds or disputes. Buyer
                        verification is not required.
                      </p>
                      <form
                        onSubmit={(e) => void handleSaveBuyerSettings(e)}
                        className="grid gap-4 sm:grid-cols-2"
                      >
                        <label className="text-sm">
                          <span className="mb-1 block font-medium text-[hsl(var(--dashboard-main-fg))]">
                            Default cashback %
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            value={settings.cashbackPercent}
                            onChange={(e) =>
                              setSettings({ ...settings, cashbackPercent: Number(e.target.value) })
                            }
                            className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
                          />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block font-medium text-[hsl(var(--dashboard-main-fg))]">
                            Cooling days
                          </span>
                          <input
                            type="number"
                            min={1}
                            max={90}
                            value={settings.coolingDays}
                            onChange={(e) =>
                              setSettings({ ...settings, coolingDays: Number(e.target.value) })
                            }
                            className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
                          />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block font-medium text-[hsl(var(--dashboard-main-fg))]">
                            Min order amount (€)
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={10000}
                            step={0.01}
                            value={settings.cashbackMinOrderAmount}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                cashbackMinOrderAmount: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
                          />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block font-medium text-[hsl(var(--dashboard-main-fg))]">
                            Max cashback per order (€)
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={10000}
                            step={0.01}
                            value={settings.maxCashbackPerOrder}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                maxCashbackPerOrder: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
                          />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block font-medium text-[hsl(var(--dashboard-main-fg))]">
                            Max cashback per month (€)
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={10000}
                            step={0.01}
                            value={settings.maxCashbackPerMonth}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                maxCashbackPerMonth: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
                          />
                        </label>
                        <label className="flex items-center gap-2 text-sm sm:col-span-2">
                          <input
                            type="checkbox"
                            checked={settings.cashbackEnabled}
                            onChange={(e) =>
                              setSettings({ ...settings, cashbackEnabled: e.target.checked })
                            }
                          />
                          Cashback enabled
                        </label>
                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2 sm:w-fit"
                        >
                          {saving ? 'Saving…' : 'Save buyer cashback defaults'}
                        </button>
                      </form>
                    </DashboardCard>

                    <AdminMonetizationBuyerCashbackOverrides
                      role={role}
                      onMessage={handlePanelMessage}
                      onError={handlePanelError}
                    />
                  </>
                )}
              </div>
            )}

            {activeTab === 'catalog' && (
              <AdminMonetizationProductCatalog
                role={role}
                boostsEnabled={settings.boostsEnabled}
                featuredEnabled={settings.featuredEnabled ?? true}
                onMessage={handlePanelMessage}
                onError={handlePanelError}
                onGoToAdvertising={() => setActiveTab('advertising')}
              />
            )}
          </>
        )}
      </DashboardPageShell>
    </>
  );
}
