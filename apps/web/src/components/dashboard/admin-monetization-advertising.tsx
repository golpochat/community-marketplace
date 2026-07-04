'use client';

import type { AdsSystemModuleCode, AdsSystemStatus, MonetizationSettings } from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

type ModuleSettingsField = 'displayAdsEnabled' | 'boostsEnabled' | 'featuredEnabled';

interface ModuleMeta {
  code: AdsSystemModuleCode;
  label: string;
  description: string;
  settingsField: ModuleSettingsField;
  envNote?: string;
  catalogNote?: string;
}

const MODULE_META: ModuleMeta[] = [
  {
    code: 'display_advertising',
    label: 'Display advertising',
    description: 'Banner slots on the homepage, category browse, and search results.',
    settingsField: 'displayAdsEnabled',
    envNote: 'Also requires ADS_SYSTEM_ENABLED=true in API .env. Use ADS_PREVIEW_MODE to test layouts before publishing.',
  },
  {
    code: 'listing_boost',
    label: 'Listing boosts',
    description: 'Lets sellers pay to boost listing visibility. Configure individual SKUs on the Listing promotions tab.',
    settingsField: 'boostsEnabled',
    catalogNote: 'Listing promotions',
  },
  {
    code: 'featured_slots',
    label: 'Featured slots',
    description: 'Paid homepage and category featured placement for sellers. Configure SKUs on the Listing promotions tab.',
    settingsField: 'featuredEnabled',
    catalogNote: 'Listing promotions',
  },
];

function moduleStatusLabel(
  module: AdsSystemStatus['modules'][number] | undefined,
): { text: string; tone: 'published' | 'preview' | 'off' } {
  if (!module || !module.effective) {
    return { text: 'Off', tone: 'off' };
  }
  if (module.preview) {
    return { text: 'Preview', tone: 'preview' };
  }
  return { text: 'Live', tone: 'published' };
}

function StatusBadge({ tone, text }: { tone: 'published' | 'preview' | 'off'; text: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        tone === 'published' && 'bg-green-100 text-green-800',
        tone === 'preview' && 'bg-amber-100 text-amber-900',
        tone === 'off' && 'bg-[hsl(var(--dashboard-sidebar-active)/0.5)] text-[hsl(var(--dashboard-sidebar-muted))]',
      )}
    >
      {text}
    </span>
  );
}

function ModulePublishSwitch({
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
  settings: MonetizationSettings;
  adsSystem: AdsSystemStatus | null;
  saving: boolean;
  onSettingsChange: (settings: MonetizationSettings) => void;
  onSave: (event: React.FormEvent) => Promise<void>;
  onGoToCatalog?: () => void;
}

export function AdminMonetizationAdvertising({
  settings,
  adsSystem,
  saving,
  onSettingsChange,
  onSave,
  onGoToCatalog,
}: AdminMonetizationAdvertisingProps) {
  const moduleByCode = new Map(adsSystem?.modules.map((module) => [module.code, module]));

  return (
    <div className="space-y-6">
      <DashboardCard title="Deploy status">
        <p className="mb-4 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          These flags are set in API environment variables and require a server restart to change.
          They control whether the display-ads shell exists and whether unpublished slots can be
          previewed.
        </p>
        {adsSystem ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2">
              <dt className="font-medium text-[hsl(var(--dashboard-main-fg))]">ADS_SYSTEM_ENABLED</dt>
              <dd className="mt-1 text-[hsl(var(--dashboard-sidebar-muted))]">
                {adsSystem.systemEnabled ? 'true — display ads shell is active' : 'false — display ads shell is off'}
              </dd>
            </div>
            <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2">
              <dt className="font-medium text-[hsl(var(--dashboard-main-fg))]">ADS_PREVIEW_MODE</dt>
              <dd className="mt-1 text-[hsl(var(--dashboard-sidebar-muted))]">
                {adsSystem.previewMode
                  ? 'true — preview placeholders when display ads are not published'
                  : 'false — no preview placeholders'}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Deploy status unavailable.</p>
        )}
      </DashboardCard>

      <DashboardCard title="Module publish toggles">
        <p className="mb-4 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          Turn entire product families on or off for sellers and buyers. Individual boost and
          featured SKUs are managed separately on{' '}
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
          .
        </p>

        <form onSubmit={(e) => void onSave(e)} className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-sidebar-muted))]">
                  <th className="py-2 pr-4 font-medium">Module</th>
                  <th className="py-2 pr-4 font-medium">Live status</th>
                  <th className="py-2 pr-4 font-medium">Published</th>
                </tr>
              </thead>
              <tbody>
                {MODULE_META.map((meta) => {
                  const module = moduleByCode.get(meta.code);
                  const status = moduleStatusLabel(module);
                  const published = Boolean(settings[meta.settingsField]);

                  return (
                    <tr
                      key={meta.code}
                      className="border-b border-[hsl(var(--dashboard-sidebar-border)/0.5)] align-top"
                    >
                      <td className="py-3 pr-4">
                        <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">{meta.label}</p>
                        <p className="mt-1 max-w-md text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                          {meta.description}
                        </p>
                        {meta.envNote && (
                          <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                            {meta.envNote}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge tone={status.tone} text={status.text} />
                      </td>
                      <td className="py-3">
                        <ModulePublishSwitch
                          checked={published}
                          disabled={saving}
                          label={`${published ? 'Unpublish' : 'Publish'} ${meta.label}`}
                          onChange={(checked) =>
                            onSettingsChange({ ...settings, [meta.settingsField]: checked })
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save module settings'}
          </button>
        </form>
      </DashboardCard>

      <DashboardCard title="How it works">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          <li>
            <span className="text-[hsl(var(--dashboard-main-fg))]">Deploy</span> — set{' '}
            <code className="text-xs">ADS_SYSTEM_ENABLED</code> in API <code className="text-xs">.env</code>{' '}
            and restart the API.
          </li>
          <li>
            <span className="text-[hsl(var(--dashboard-main-fg))]">Preview (optional)</span> — with{' '}
            <code className="text-xs">ADS_PREVIEW_MODE=true</code>, leave display advertising off to
            see dashed preview slots on the site.
          </li>
          <li>
            <span className="text-[hsl(var(--dashboard-main-fg))]">Publish modules</span> — use the
            toggles above to go live with display ads, boosts, and/or featured slots.
          </li>
          <li>
            <span className="text-[hsl(var(--dashboard-main-fg))]">Configure SKUs</span> — on Listing
            promotions, add or edit boost and featured products; only published SKUs appear in seller
            checkout.
          </li>
        </ol>
      </DashboardCard>
    </div>
  );
}
