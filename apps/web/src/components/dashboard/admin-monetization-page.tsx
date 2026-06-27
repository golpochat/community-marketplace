'use client';

import { useCallback, useEffect, useState } from 'react';

import type { MonetizationSettings } from '@community-marketplace/types';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

import { DashboardPageShell } from '@/components/dashboard/async-resource';
import { monetizationService } from '@/services/monetization.service';
import type { AdminServiceRole } from '@/services/admin.service';

interface AdminMonetizationPageProps {
  role: AdminServiceRole;
}

export function AdminMonetizationPage({ role }: AdminMonetizationPageProps) {
  const [settings, setSettings] = useState<MonetizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sellerUserId, setSellerUserId] = useState('');
  const [sellerFee, setSellerFee] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await monetizationService.getMonetizationSettings(role);
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monetization settings');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await monetizationService.updateMonetizationSettings(role, {
        defaultPlatformFeePercent: settings.defaultPlatformFeePercent,
        verifiedSellerFeePercent: settings.verifiedSellerFeePercent,
        cashbackPercent: settings.cashbackPercent,
        coolingDays: settings.coolingDays,
        maxCashbackPerOrder: settings.maxCashbackPerOrder,
        maxCashbackPerMonth: settings.maxCashbackPerMonth,
        cashbackEnabled: settings.cashbackEnabled,
        cashbackMinOrderAmount: settings.cashbackMinOrderAmount,
        boostsEnabled: settings.boostsEnabled,
        boostPrice7d: settings.pricing.skus.boost_7d.amount,
        boostPrice30d: settings.pricing.skus.boost_30d.amount,
      });
      setSettings(updated);
      setMessage('Settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleSellerFeeOverride(clear = false) {
    if (!sellerUserId.trim()) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await monetizationService.setSellerFeeOverride(role, {
        userId: sellerUserId.trim(),
        customPlatformFeePercent: clear ? null : Number(sellerFee),
      });
      setMessage(clear ? 'Seller fee override cleared.' : 'Seller fee override saved.');
      setSellerUserId('');
      setSellerFee('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update seller fee');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DashboardPageShell
        title="Monetization"
        description="Platform fees, listing boosts, and card-payment cashback settings."
        loading={loading}
        error={error}
        empty={false}
      >
        {message && <p className="mb-4 text-sm text-green-700">{message}</p>}
        {settings && (
          <div className="space-y-6">
            <DashboardCard title="Platform fees & cashback">
              <form onSubmit={(e) => void handleSave(e)} className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Default platform fee %</span>
                  <input
                    type="number"
                    min={3}
                    max={15}
                    step={0.1}
                    value={settings.defaultPlatformFeePercent}
                    onChange={(e) =>
                      setSettings({ ...settings, defaultPlatformFeePercent: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Verified seller fee %</span>
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
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Cashback %</span>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={settings.cashbackPercent}
                    onChange={(e) =>
                      setSettings({ ...settings, cashbackPercent: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Cooling days</span>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={settings.coolingDays}
                    onChange={(e) =>
                      setSettings({ ...settings, coolingDays: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
                  Cashback enabled (card payments only)
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2 sm:w-fit"
                >
                  {saving ? 'Saving…' : 'Save settings'}
                </button>
              </form>
            </DashboardCard>

            <DashboardCard title="Listing boosts">
              <form onSubmit={(e) => void handleSave(e)} className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">7-day boost price (€)</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={settings.pricing.skus.boost_7d.amount}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pricing: {
                          ...settings.pricing,
                          skus: {
                            ...settings.pricing.skus,
                            boost_7d: {
                              ...settings.pricing.skus.boost_7d,
                              amount: Number(e.target.value),
                            },
                          },
                        },
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">30-day boost price (€)</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={settings.pricing.skus.boost_30d.amount}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pricing: {
                          ...settings.pricing,
                          skus: {
                            ...settings.pricing.skus,
                            boost_30d: {
                              ...settings.pricing.skus.boost_30d,
                              amount: Number(e.target.value),
                            },
                          },
                        },
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={settings.boostsEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, boostsEnabled: e.target.checked })
                    }
                  />
                  Boosts enabled
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2 sm:w-fit"
                >
                  {saving ? 'Saving…' : 'Save boost settings'}
                </button>
              </form>
            </DashboardCard>

            <DashboardCard title="Per-seller fee override">
              <p className="mb-3 text-xs text-gray-600">
                Set a custom platform fee for a seller (3–15%). Leave blank and clear to revert to default.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={sellerUserId}
                  onChange={(e) => setSellerUserId(e.target.value)}
                  placeholder="Seller user ID"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min={3}
                  max={15}
                  step={0.1}
                  value={sellerFee}
                  onChange={(e) => setSellerFee(e.target.value)}
                  placeholder="Fee %"
                  className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={saving || !sellerUserId}
                  onClick={() => void handleSellerFeeOverride(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Set override
                </button>
                <button
                  type="button"
                  disabled={saving || !sellerUserId}
                  onClick={() => void handleSellerFeeOverride(true)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </DashboardCard>
          </div>
        )}
      </DashboardPageShell>
    </>
  );
}
