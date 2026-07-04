'use client';

import type { PlatformGovernanceSettings, PlatformGovernanceStatus } from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

function ToggleSwitch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--dashboard-accent))] focus:ring-offset-2',
        checked ? 'bg-[hsl(var(--dashboard-accent))]' : 'bg-[hsl(var(--dashboard-sidebar-border))]',
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

function GovernanceOverrideField({
  title,
  description,
  envLabel,
  envValue,
  enabled,
  value,
  inputType,
  placeholder,
  onEnabledChange,
  onValueChange,
}: {
  title: string;
  description: string;
  envLabel: string;
  envValue: string;
  enabled: boolean;
  value: string;
  inputType: 'email' | 'text';
  placeholder: string;
  onEnabledChange: (enabled: boolean) => void;
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{description}</p>
        </div>
        <ToggleSwitch checked={enabled} label={`Override ${title.toLowerCase()}`} onChange={onEnabledChange} />
      </div>
      {enabled ? (
        <input
          type={inputType}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className="mt-3 w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
        />
      ) : (
        <p className="mt-3 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          Using <span className="font-medium text-[hsl(var(--dashboard-foreground))]">{envValue}</span>{' '}
          <span className="text-xs">({envLabel})</span>
        </p>
      )}
    </div>
  );
}

interface AdminPlatformGovernanceCardProps {
  status: PlatformGovernanceStatus;
  draft: PlatformGovernanceSettings;
  saving: boolean;
  message: string | null;
  error: string | null;
  onDraftChange: (draft: PlatformGovernanceSettings) => void;
  onSave: (event: React.FormEvent) => void;
}

export function AdminPlatformGovernanceCard({
  status,
  draft,
  saving,
  message,
  error,
  onDraftChange,
  onSave,
}: AdminPlatformGovernanceCardProps) {
  function updateDraft<K extends keyof PlatformGovernanceSettings>(key: K, value: PlatformGovernanceSettings[K]) {
    onDraftChange({ ...draft, [key]: value });
  }

  return (
    <DashboardCard
      title="Platform governance"
      description="Operational flags and branding. Defaults come from app config and server environment — enable an override only when you need to change a single field."
    >
      <form onSubmit={onSave} className="space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Maintenance mode</p>
            <p className="text-xs text-amber-900/80">
              Blocks buyers and sellers from the API. Admins and super-admins can still operate.
            </p>
          </div>
          <ToggleSwitch
            checked={draft.maintenanceMode}
            label="Maintenance mode"
            onChange={(checked) => updateDraft('maintenanceMode', checked)}
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold">Branding &amp; locale</h3>
          <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Live values: {status.effective.platformName} · {status.effective.supportEmail} ·{' '}
            {status.effective.defaultCurrency}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <GovernanceOverrideField
            title="Platform name"
            description="Shown in emails, PDFs, and public metadata."
            envLabel="APP_SHORT_NAME"
            envValue={status.envDefaults.platformName}
            enabled={draft.platformNameOverrideEnabled}
            value={draft.platformName ?? ''}
            inputType="text"
            placeholder={status.envDefaults.platformName}
            onEnabledChange={(enabled) => {
              updateDraft('platformNameOverrideEnabled', enabled);
              if (enabled && !draft.platformName) {
                updateDraft('platformName', status.envDefaults.platformName);
              }
            }}
            onValueChange={(value) => updateDraft('platformName', value || null)}
          />
          <GovernanceOverrideField
            title="Support email"
            description="Help and contact links in emails — not the transactional from address."
            envLabel="SUPPORT_EMAIL / EMAIL_FROM"
            envValue={status.envDefaults.supportEmail}
            enabled={draft.supportEmailOverrideEnabled}
            value={draft.supportEmail ?? ''}
            inputType="email"
            placeholder={status.envDefaults.supportEmail}
            onEnabledChange={(enabled) => {
              updateDraft('supportEmailOverrideEnabled', enabled);
              if (enabled && !draft.supportEmail) {
                updateDraft('supportEmail', status.envDefaults.supportEmail);
              }
            }}
            onValueChange={(value) => updateDraft('supportEmail', value || null)}
          />
        </div>

        <GovernanceOverrideField
          title="Default currency"
          description="Display default for marketplace pricing when not set per order."
          envLabel="PLATFORM_CURRENCY"
          envValue={status.envDefaults.defaultCurrency}
          enabled={draft.defaultCurrencyOverrideEnabled}
          value={draft.defaultCurrency ?? ''}
          inputType="text"
          placeholder={status.envDefaults.defaultCurrency}
          onEnabledChange={(enabled) => {
            updateDraft('defaultCurrencyOverrideEnabled', enabled);
            if (enabled && !draft.defaultCurrency) {
              updateDraft('defaultCurrency', status.envDefaults.defaultCurrency);
            }
          }}
          onValueChange={(value) => updateDraft('defaultCurrency', value.toUpperCase() || null)}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-3">
            <div>
              <p className="text-sm font-medium">Email notifications</p>
              <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                Global kill switch before per-user preferences.
              </p>
            </div>
            <ToggleSwitch
              checked={draft.emailNotificationsEnabled}
              label="Email notifications enabled"
              onChange={(checked) => updateDraft('emailNotificationsEnabled', checked)}
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-3">
            <div>
              <p className="text-sm font-medium">Push notifications</p>
              <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                Global kill switch for mobile push delivery.
              </p>
            </div>
            <ToggleSwitch
              checked={draft.pushNotificationsEnabled}
              label="Push notifications enabled"
              onChange={(checked) => updateDraft('pushNotificationsEnabled', checked)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-3">
            <div>
              <p className="text-sm font-medium">Require MFA for admins</p>
              <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                Policy flag — enforced when MFA auth is implemented.
              </p>
            </div>
            <ToggleSwitch
              checked={draft.securityMfaRequired}
              label="Require MFA for admins"
              onChange={(checked) => updateDraft('securityMfaRequired', checked)}
            />
          </div>
          <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-3">
            <p className="text-sm font-medium">Payments</p>
            <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Provider: Stripe (read-only). Configure keys in API <code className="text-xs">.env</code>.
            </p>
            <p className="mt-2 text-sm">
              Status:{' '}
              <span
                className={cn(
                  'font-medium',
                  status.payments.configured ? 'text-green-700' : 'text-amber-700',
                )}
              >
                {status.payments.configured ? 'Configured' : 'Not configured'}
              </span>
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save platform settings'}
        </button>

        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </DashboardCard>
  );
}
