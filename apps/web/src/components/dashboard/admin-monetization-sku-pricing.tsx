'use client';

import type {
  MonetizationSettings,
  PlatformPricingConfig,
  PlatformSkuConfig,
} from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

type SkuKey = keyof PlatformPricingConfig['skus'];

interface SkuRowDef {
  key: SkuKey;
  label: string;
  hint?: string;
  showWalletCredit?: boolean;
  showBoostDiscount?: boolean;
}

const SKU_GROUPS: { title: string; hint?: string; rows: SkuRowDef[] }[] = [
  {
    title: 'Listing boosts',
    hint: 'Fallback when no published Catalog products exist. Catalog prices win when published.',
    rows: [
      { key: 'boost_7d', label: 'Boost 7 days' },
      { key: 'boost_30d', label: 'Boost 30 days' },
    ],
  },
  {
    title: 'Featured placements',
    hint: 'Listing featured slots; Catalog can override when products are published.',
    rows: [
      { key: 'featured_category', label: 'Featured in category' },
      { key: 'featured_homepage', label: 'Featured on homepage' },
      { key: 'featured_store_homepage', label: 'Featured store (homepage)' },
    ],
  },
  {
    title: 'Keep Live (Shop Shelf)',
    hint: 'Extend live window without boost ranking. Purchase checkout wires in with hard shelf enforce.',
    rows: [
      { key: 'keep_live_7d', label: 'Keep Live 7 days' },
      { key: 'keep_live_30d', label: 'Keep Live 30 days' },
    ],
  },
  {
    title: 'Storefront slots',
    rows: [
      { key: 'store_slot_2', label: '2nd storefront slot' },
      { key: 'store_slot_3', label: '3rd storefront slot' },
      { key: 'store_bundle_3', label: 'Bundle (slots 2+3)' },
    ],
  },
  {
    title: 'Seller packs & AI credits',
    rows: [
      {
        key: 'seller_growth_pack',
        label: 'Seller growth pack',
        showWalletCredit: true,
        showBoostDiscount: true,
      },
      { key: 'ai_credit_2', label: 'AI credit €2 pack', showWalletCredit: true },
      { key: 'ai_credit_5', label: 'AI credit €5 pack', showWalletCredit: true },
      { key: 'ai_credit_10', label: 'AI credit €10 pack', showWalletCredit: true },
    ],
  },
  {
    title: 'Other SKUs',
    rows: [
      { key: 'fast_track_verification', label: 'Fast-track verification' },
      { key: 'priority_message', label: 'Priority message' },
      { key: 'buyer_statement', label: 'Buyer statement' },
      { key: 'early_cashback_unlock', label: 'Early cashback unlock' },
    ],
  },
];

function PublishSwitch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--dashboard-accent))] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        checked
          ? 'bg-[hsl(var(--dashboard-accent))]'
          : 'bg-[hsl(var(--dashboard-sidebar-border))]',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}

function skuOrDefault(
  pricing: PlatformPricingConfig,
  key: SkuKey,
): PlatformSkuConfig & { walletCreditEur?: number; boostDiscountPercent?: number } {
  const current = pricing.skus[key];
  if (current) return current;
  return { amount: 0, enabled: false };
}

interface AdminMonetizationSkuPricingProps {
  settings: MonetizationSettings;
  saving: boolean;
  onSettingsChange: (settings: MonetizationSettings) => void;
  onSave: (event: React.FormEvent) => Promise<void>;
}

export function AdminMonetizationSkuPricing({
  settings,
  saving,
  onSettingsChange,
  onSave,
}: AdminMonetizationSkuPricingProps) {
  const pricing = settings.pricing;
  const shelf = pricing.shopShelf ?? {
    primaryFreeLive: 5,
    extraStoreFreeLive: 3,
    earnBackExtraDays: 7,
    enforceHardCap: false,
  };

  function patchSku(
    key: SkuKey,
    patch: Partial<PlatformSkuConfig & { walletCreditEur?: number; boostDiscountPercent?: number }>,
  ) {
    const prev = skuOrDefault(pricing, key);
    onSettingsChange({
      ...settings,
      pricing: {
        ...pricing,
        skus: {
          ...pricing.skus,
          [key]: { ...prev, ...patch },
        },
      },
    });
  }

  function patchPricing(next: Partial<PlatformPricingConfig>) {
    onSettingsChange({
      ...settings,
      pricing: { ...pricing, ...next },
    });
  }

  return (
    <form onSubmit={(e) => void onSave(e)} className="space-y-6">
      <DashboardCard title="Shop Shelf caps">
        <p className="mb-4 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          Free live listing caps. Soft mode stores the rules for UI/copy; hard enforce pauses
          over-cap listings later.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-[hsl(var(--dashboard-main-fg))]">
              Primary store free live
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={shelf.primaryFreeLive}
              onChange={(e) =>
                patchPricing({
                  shopShelf: { ...shelf, primaryFreeLive: Number(e.target.value) },
                })
              }
              className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-[hsl(var(--dashboard-main-fg))]">
              Extra store free live
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={shelf.extraStoreFreeLive}
              onChange={(e) =>
                patchPricing({
                  shopShelf: { ...shelf, extraStoreFreeLive: Number(e.target.value) },
                })
              }
              className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-[hsl(var(--dashboard-main-fg))]">
              Card earn-back days
            </span>
            <input
              type="number"
              min={0}
              max={90}
              value={shelf.earnBackExtraDays}
              onChange={(e) =>
                patchPricing({
                  shopShelf: { ...shelf, earnBackExtraDays: Number(e.target.value) },
                })
              }
              className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
                Hard enforce cap
              </p>
              <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">Off for soft pilot</p>
            </div>
            <PublishSwitch
              checked={shelf.enforceHardCap}
              disabled={saving}
              label="Hard enforce Shop Shelf cap"
              onChange={(checked) =>
                patchPricing({ shopShelf: { ...shelf, enforceHardCap: checked } })
              }
            />
          </div>
        </div>
      </DashboardCard>

      <DashboardCard title="Promos & featured inventory">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-[hsl(var(--dashboard-main-fg))]">
              First boost discount %
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={pricing.promos?.first_boost_discount_percent ?? 0}
              onChange={(e) =>
                patchPricing({
                  promos: {
                    ...pricing.promos,
                    first_boost_discount_percent: Number(e.target.value),
                  },
                })
              }
              className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-[hsl(var(--dashboard-main-fg))]">
              Homepage featured slots / day
            </span>
            <input
              type="number"
              min={1}
              max={100}
              value={pricing.featured?.homepage_slots_per_day ?? 8}
              onChange={(e) =>
                patchPricing({
                  featured: {
                    ...pricing.featured,
                    homepage_slots_per_day: Number(e.target.value),
                  },
                })
              }
              className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-[hsl(var(--dashboard-main-fg))]">
              Category featured slots / day
            </span>
            <input
              type="number"
              min={1}
              max={100}
              value={pricing.featured?.category_slots_per_day ?? 4}
              onChange={(e) =>
                patchPricing({
                  featured: {
                    ...pricing.featured,
                    category_slots_per_day: Number(e.target.value),
                  },
                })
              }
              className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-[hsl(var(--dashboard-main-fg))]">
              Featured store slots / day
            </span>
            <input
              type="number"
              min={1}
              max={100}
              value={pricing.featured?.store_homepage_slots_per_day ?? 6}
              onChange={(e) =>
                patchPricing({
                  featured: {
                    ...pricing.featured,
                    store_homepage_slots_per_day: Number(e.target.value),
                  },
                })
              }
              className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            />
          </label>
        </div>
      </DashboardCard>

      {SKU_GROUPS.map((group) => (
        <DashboardCard key={group.title} title={group.title}>
          {group.hint ? (
            <p className="mb-4 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{group.hint}</p>
          ) : null}
          <div className="space-y-3">
            {group.rows.map((row) => {
              const sku = skuOrDefault(pricing, row.key);
              return (
                <div
                  key={row.key}
                  className="grid gap-3 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
                      {row.label}
                    </p>
                    <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{row.key}</p>
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="text-sm">
                      <span className="mb-1 block text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                        Price (€)
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={999}
                        step={0.01}
                        value={sku.amount}
                        onChange={(e) => patchSku(row.key, { amount: Number(e.target.value) })}
                        className="w-28 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
                      />
                    </label>
                    {row.showWalletCredit ? (
                      <label className="text-sm">
                        <span className="mb-1 block text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                          Credit (€)
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={999}
                          step={0.01}
                          value={sku.walletCreditEur ?? 0}
                          onChange={(e) =>
                            patchSku(row.key, { walletCreditEur: Number(e.target.value) })
                          }
                          className="w-24 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
                        />
                      </label>
                    ) : null}
                    {row.showBoostDiscount ? (
                      <label className="text-sm">
                        <span className="mb-1 block text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                          Boost off %
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={sku.boostDiscountPercent ?? 0}
                          onChange={(e) =>
                            patchSku(row.key, { boostDiscountPercent: Number(e.target.value) })
                          }
                          className="w-24 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
                        />
                      </label>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <span className="text-xs text-[hsl(var(--dashboard-sidebar-muted))] sm:hidden">
                      Enabled
                    </span>
                    <PublishSwitch
                      checked={sku.enabled}
                      disabled={saving}
                      label={`Enable ${row.label}`}
                      onChange={(checked) => patchSku(row.key, { enabled: checked })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardCard>
      ))}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save SKU pricing'}
      </button>
    </form>
  );
}
