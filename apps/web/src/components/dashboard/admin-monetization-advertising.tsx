'use client';

import type { AdsSystemModuleCode, AdsSystemStatus, MonetizationSettings } from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

import { AdminMonetizationDisplayCampaigns } from '@/components/dashboard/admin-monetization-display-campaigns';
import type { AdminServiceRole } from '@/services/admin.service';

type ModuleSettingsField = 'displayAdsEnabled' | 'boostsEnabled' | 'featuredEnabled';

interface ProductRow {
  id: string;
  label: string;
  hint: string;
  settingsField: ModuleSettingsField;
  adsCode: AdsSystemModuleCode;
  catalogLink?: boolean;
}

const PRODUCT_ROWS: ProductRow[] = [
  {
    id: 'boosts',
    label: 'Listing boosts',
    hint: 'Paid visibility packages for listings',
    settingsField: 'boostsEnabled',
    adsCode: 'listing_boost',
    catalogLink: true,
  },
  {
    id: 'featured',
    label: 'Featured placements',
    hint: 'Homepage & category featured slots · also used for featured shops',
    settingsField: 'featuredEnabled',
    adsCode: 'featured_slots',
    catalogLink: true,
  },
  {
    id: 'display',
    label: 'Display advertising',
    hint: 'Banner slots · admin campaigns under Display campaigns below',
    settingsField: 'displayAdsEnabled',
    adsCode: 'display_advertising',
  },
];

function moduleStatusLabel(
  moduleState: AdsSystemStatus['modules'][number] | undefined,
): { text: string; tone: 'published' | 'preview' | 'off' } {
  if (!moduleState || !moduleState.effective) {
    return { text: 'Off', tone: 'off' };
  }
  if (moduleState.preview) {
    return { text: 'Preview', tone: 'preview' };
  }
  return { text: 'Live', tone: 'published' };
}

function StatusBadge({ tone, text }: { tone: 'published' | 'preview' | 'off'; text: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
        tone === 'published' && 'bg-green-100 text-green-800',
        tone === 'preview' && 'bg-amber-100 text-amber-900',
        tone === 'off' &&
          'bg-[hsl(var(--dashboard-sidebar-active)/0.5)] text-[hsl(var(--dashboard-sidebar-muted))]',
      )}
    >
      {text}
    </span>
  );
}

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

interface AdminMonetizationAdvertisingProps {
  role: AdminServiceRole;
  settings: MonetizationSettings;
  adsSystem: AdsSystemStatus | null;
  saving: boolean;
  onSettingsChange: (settings: MonetizationSettings) => void;
  onSave: (event: React.FormEvent) => Promise<void>;
  onGoToCatalog?: () => void;
  onGoToAiMarketing?: () => void;
  onMessage: (message: string) => void;
  onError: (error: string) => void;
}

export function AdminMonetizationAdvertising({
  role,
  settings,
  adsSystem,
  saving,
  onSettingsChange,
  onSave,
  onGoToCatalog,
  onGoToAiMarketing,
  onMessage,
  onError,
}: AdminMonetizationAdvertisingProps) {
  const moduleByCode = new Map(adsSystem?.modules.map((item) => [item.code, item]));

  return (
    <div className="space-y-6">
      <DashboardCard title="Seller products">
        <p className="mb-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          Publish advertising products for sellers. Configure boost and featured SKUs on{' '}
          {onGoToCatalog ? (
            <button
              type="button"
              onClick={onGoToCatalog}
              className="font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
            >
              Listing promotions
            </button>
          ) : (
            'Listing promotions'
          )}
          . AI Hub settings live on{' '}
          {onGoToAiMarketing ? (
            <button
              type="button"
              onClick={onGoToAiMarketing}
              className="font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
            >
              AI Marketing
            </button>
          ) : (
            'AI Marketing'
          )}
          .
        </p>

        <form onSubmit={(e) => void onSave(e)} className="space-y-4">
          <ul className="divide-y divide-[hsl(var(--dashboard-sidebar-border)/0.6)] rounded-lg border border-[hsl(var(--dashboard-sidebar-border))]">
            {PRODUCT_ROWS.map((row) => {
              const published = Boolean(settings[row.settingsField]);
              const status = moduleStatusLabel(moduleByCode.get(row.adsCode));

              return (
                <li
                  key={row.id}
                  className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">{row.label}</p>
                      <StatusBadge tone={status.tone} text={status.text} />
                    </div>
                    <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                      {row.hint}
                      {row.catalogLink && onGoToCatalog ? (
                        <>
                          {' · '}
                          <button
                            type="button"
                            onClick={onGoToCatalog}
                            className="font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
                          >
                            Edit SKUs
                          </button>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="text-xs text-[hsl(var(--dashboard-sidebar-muted))] sm:hidden">
                      Published
                    </span>
                    <PublishSwitch
                      checked={published}
                      disabled={saving}
                      label={`${published ? 'Unpublish' : 'Publish'} ${row.label}`}
                      onChange={(checked) =>
                        onSettingsChange({ ...settings, [row.settingsField]: checked })
                      }
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Changes apply after you save. Live status also depends on deploy flags (see Advanced).
            </p>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:w-auto"
            >
              {saving ? 'Saving…' : 'Save advertising settings'}
            </button>
          </div>
        </form>
      </DashboardCard>

      <AdminMonetizationDisplayCampaigns
        role={role}
        onMessage={onMessage}
        onError={onError}
      />

      <DashboardCard title="Advanced · deploy flags">
        <details className="group">
          <summary className="cursor-pointer list-none text-sm text-[hsl(var(--dashboard-sidebar-muted))] marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="font-medium text-[hsl(var(--dashboard-accent))] group-open:hidden">
              Show deploy flags
            </span>
            <span className="hidden font-medium text-[hsl(var(--dashboard-accent))] group-open:inline">
              Hide deploy flags
            </span>
          </summary>
          <div className="mt-4 space-y-4">
            <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Set in API <code className="text-xs">.env</code> /{' '}
              <code className="text-xs">.env.prod</code> and restart the API. Read-only here.
            </p>
            {adsSystem ? (
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2">
                  <dt className="text-xs font-medium text-[hsl(var(--dashboard-sidebar-muted))]">
                    Display ads shell
                  </dt>
                  <dd className="mt-1 font-medium text-[hsl(var(--dashboard-main-fg))]">
                    {adsSystem.systemEnabled ? 'On' : 'Off'}
                  </dd>
                  <dd className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                    <code className="text-xs">ADS_SYSTEM_ENABLED</code>
                  </dd>
                </div>
                <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2">
                  <dt className="text-xs font-medium text-[hsl(var(--dashboard-sidebar-muted))]">
                    Preview placeholders
                  </dt>
                  <dd className="mt-1 font-medium text-[hsl(var(--dashboard-main-fg))]">
                    {adsSystem.previewMode ? 'On' : 'Off'}
                  </dd>
                  <dd className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                    <code className="text-xs">ADS_PREVIEW_MODE</code>
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                Deploy status unavailable.
              </p>
            )}
          </div>
        </details>
      </DashboardCard>
    </div>
  );
}
