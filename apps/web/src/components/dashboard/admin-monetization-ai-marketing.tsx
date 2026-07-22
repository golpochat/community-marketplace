'use client';

import type { AiMarketingAccessStatus, MonetizationSettings } from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

import { AdminMarketingHubAnalytics } from '@/components/dashboard/admin-marketing-hub-analytics';
import { AdminMonetizationAiFreeUnitsOverrides } from '@/components/dashboard/admin-monetization-ai-free-units-overrides';
import type { AdminServiceRole } from '@/services/admin.service';

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

interface AdminMonetizationAiMarketingProps {
  role: AdminServiceRole;
  settings: MonetizationSettings;
  access: AiMarketingAccessStatus | null;
  saving: boolean;
  onSettingsChange: (settings: MonetizationSettings) => void;
  onSave: (event: React.FormEvent) => Promise<void>;
  onMessage: (message: string) => void;
  onError: (error: string) => void;
  onGoToAdvertising?: () => void;
}

export function AdminMonetizationAiMarketing({
  role,
  settings,
  access,
  saving,
  onSettingsChange,
  onSave,
  onMessage,
  onError,
  onGoToAdvertising,
}: AdminMonetizationAiMarketingProps) {
  const published = Boolean(settings.aiMarketingEnabled);
  const deployEnabled = access?.deployEnabled ?? true;
  const sellersCanUse = access?.effective ?? (published && deployEnabled);

  return (
    <div className="space-y-6">
      <DashboardCard title="AI Marketing Hub">
        <p className="mb-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          Publish the seller AI hub and set the default free monthly allowance. Boosts, featured, and
          display ads live on{' '}
          {onGoToAdvertising ? (
            <button
              type="button"
              onClick={onGoToAdvertising}
              className="font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
            >
              Advertising
            </button>
          ) : (
            'Advertising'
          )}
          .
        </p>

        <form onSubmit={(e) => void onSave(e)} className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">Hub published</p>
                <span
                  className={cn(
                    'inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                    sellersCanUse
                      ? 'bg-green-100 text-green-800'
                      : published && !deployEnabled
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-[hsl(var(--dashboard-sidebar-active)/0.5)] text-[hsl(var(--dashboard-sidebar-muted))]',
                  )}
                >
                  {sellersCanUse
                    ? 'Live'
                    : published && !deployEnabled
                      ? 'Blocked by deploy'
                      : 'Off'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                Seller AI copy, images & credits. Sellers only see the hub when this is published and
                the deploy kill switch allows it (see Advanced).
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-xs text-[hsl(var(--dashboard-sidebar-muted))] sm:hidden">
                Published
              </span>
              <PublishSwitch
                checked={published}
                disabled={saving}
                label={`${published ? 'Unpublish' : 'Publish'} AI Marketing Hub`}
                onChange={(checked) =>
                  onSettingsChange({ ...settings, aiMarketingEnabled: checked })
                }
              />
            </div>
          </div>

          <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] p-3">
            <label className="block text-sm">
              <span className="font-medium text-[hsl(var(--dashboard-main-fg))]">
                Free AI units / month (verified sellers)
              </span>
              <span className="mt-0.5 block text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                Unverified sellers get 0 unless you set a per-seller override. Paid overage stays
                €0.05/unit from SellNearby Credit.
              </span>
              <input
                type="number"
                min={0}
                max={500}
                step={1}
                disabled={saving}
                value={settings.aiMarketingFreeUnitsMonthly}
                onChange={(event) => {
                  const next = Number.parseInt(event.target.value, 10);
                  onSettingsChange({
                    ...settings,
                    aiMarketingFreeUnitsMonthly: Number.isFinite(next)
                      ? Math.min(500, Math.max(0, next))
                      : 0,
                  });
                }}
                className="mt-2 w-full max-w-[10rem] rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-transparent px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))]"
              />
            </label>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Changes apply after you save.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:w-auto"
            >
              {saving ? 'Saving…' : 'Save AI settings'}
            </button>
          </div>
        </form>
      </DashboardCard>

      <AdminMonetizationAiFreeUnitsOverrides
        role={role}
        platformFreeUnitsMonthly={settings.aiMarketingFreeUnitsMonthly}
        onMessage={onMessage}
        onError={onError}
      />

      <AdminMarketingHubAnalytics role={role} />

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
            {access ? (
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2">
                  <dt className="text-xs font-medium text-[hsl(var(--dashboard-sidebar-muted))]">
                    Marketing Hub allow (kill switch off)
                  </dt>
                  <dd className="mt-1 font-medium text-[hsl(var(--dashboard-main-fg))]">
                    {access.deployEnabled ? 'On' : 'Off'}
                  </dd>
                  <dd className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                    <code className="text-xs">AI_MARKETING_ENABLED</code>
                    {access.deployEnabled
                      ? ' — currently allowing (not false)'
                      : ' — set to false; hub blocked everywhere'}
                  </dd>
                </div>
                <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2">
                  <dt className="text-xs font-medium text-[hsl(var(--dashboard-sidebar-muted))]">
                    Sellers can use hub
                  </dt>
                  <dd className="mt-1 font-medium text-[hsl(var(--dashboard-main-fg))]">
                    {access.effective ? 'Yes' : 'No'}
                  </dd>
                  <dd className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                    Needs deploy allow + Hub published
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                Deploy status unavailable.
              </p>
            )}
            <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              To hard-disable everywhere: set{' '}
              <code className="text-xs">AI_MARKETING_ENABLED=false</code> then restart the API.
            </p>
          </div>
        </details>
      </DashboardCard>
    </div>
  );
}
