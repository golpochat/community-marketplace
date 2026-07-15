'use client';

import { useCallback, useEffect, useState } from 'react';

import type { EmailPlatformSettings, EmailProviderId, EmailSystemStatus } from '@community-marketplace/types';
import { cn, useAppFeedback } from '@community-marketplace/ui';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

import { emailAdminService } from '@/services/email-admin.service';

function ProviderBadge({ configured }: { configured: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        configured ? 'bg-green-100 text-green-800' : 'bg-[hsl(var(--dashboard-sidebar-active)/0.5)] text-[hsl(var(--dashboard-sidebar-muted))]',
      )}
    >
      {configured ? 'Configured' : 'Not configured'}
    </span>
  );
}

function ToggleSwitch({
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

function SenderOverrideField({
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
        <ToggleSwitch
          checked={enabled}
          label={`Override ${title.toLowerCase()}`}
          onChange={onEnabledChange}
        />
      </div>
      {enabled ? (
        <div className="mt-3">
          <input
            type={inputType}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
          />
        </div>
      ) : (
        <p className="mt-3 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          Using <span className="font-medium text-[hsl(var(--dashboard-foreground))]">{envValue}</span>{' '}
          <span className="text-xs">({envLabel})</span>
        </p>
      )}
    </div>
  );
}

export function AdminEmailSettingsCard() {
  const feedback = useAppFeedback();
  const [status, setStatus] = useState<EmailSystemStatus | null>(null);
  const [draft, setDraft] = useState<EmailPlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await emailAdminService.getStatus();
      setStatus(data);
      setDraft(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updateDraft<K extends keyof EmailPlatformSettings>(key: K, value: EmailPlatformSettings[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await emailAdminService.updateSettings(draft);
      setDraft(updated);
      feedback.success('Email settings saved');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save email settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestSend(event: React.FormEvent) {
    event.preventDefault();
    if (!testEmail.trim()) return;
    setTesting(true);
    setError(null);
    try {
      const result = await emailAdminService.sendTest(testEmail.trim());
      feedback.success(
        result.sent ? 'Test email sent' : 'Test email logged',
        result.sent
          ? `Delivered via ${result.provider}.`
          : `Logged in stub mode (${result.provider}). Check API logs or configure provider keys in .env.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test email');
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <DashboardCard title="Transactional email" description="Loading email configuration…">
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
      </DashboardCard>
    );
  }

  if (!draft || !status) {
    return null;
  }

  const providerOptions: Array<{ id: EmailProviderId; label: string }> = status.providers.map((p) => ({
    id: p.id,
    label: p.label,
  }));

  return (
    <DashboardCard
      title="Transactional email"
      description="Provider API keys live in server environment variables. Sender defaults use EMAIL_FROM and EMAIL_FROM_NAME — enable an override below only when you need to change one field."
    >
      <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
        <div className="overflow-x-auto rounded-lg border border-[hsl(var(--dashboard-sidebar-border))]">
          <table className="min-w-full text-sm">
            <thead className="bg-[hsl(var(--dashboard-sidebar-active)/0.35)] text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Provider</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {status.providers.map((provider) => (
                <tr key={provider.id} className="border-t border-[hsl(var(--dashboard-sidebar-border))]">
                  <td className="px-4 py-3 font-medium">{provider.label}</td>
                  <td className="px-4 py-3">
                    <ProviderBadge configured={provider.configured} />
                  </td>
                  <td className="px-4 py-3 text-[hsl(var(--dashboard-sidebar-muted))]">{provider.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Primary provider</label>
            <select
              value={draft.emailProvider}
              onChange={(e) => updateDraft('emailProvider', e.target.value as EmailProviderId)}
              className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            >
              {providerOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {!status.activeProviderConfigured && draft.emailProvider !== 'stub' && (
              <p className="mt-1 text-xs text-amber-700">
                Selected provider is not configured in API .env — emails will stub or use fallback.
              </p>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-3">
            <div>
              <p className="text-sm font-medium">Provider fallback</p>
              <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                If the primary fails, try other configured providers.
              </p>
            </div>
            <ToggleSwitch
              checked={draft.emailFallbackEnabled}
              label="Enable provider fallback"
              onChange={(checked) => updateDraft('emailFallbackEnabled', checked)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Sender identity</h3>
            <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Currently sending as{' '}
              <span className="font-medium text-[hsl(var(--dashboard-foreground))]">
                {status.effectiveSender.fromName} &lt;{status.effectiveSender.fromAddress}&gt;
              </span>
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SenderOverrideField
              title="From address"
              description="Override the default EMAIL_FROM address for all providers."
              envLabel="EMAIL_FROM"
              envValue={status.envDefaults.fromAddress}
              enabled={draft.emailFromAddressOverrideEnabled}
              value={draft.emailFromAddress ?? ''}
              inputType="email"
              placeholder={status.envDefaults.fromAddress}
              onEnabledChange={(enabled) => {
                updateDraft('emailFromAddressOverrideEnabled', enabled);
                if (enabled && !draft.emailFromAddress) {
                  updateDraft('emailFromAddress', status.envDefaults.fromAddress);
                }
              }}
              onValueChange={(value) => updateDraft('emailFromAddress', value || null)}
            />
            <SenderOverrideField
              title="From name"
              description="Override the default EMAIL_FROM_NAME display name."
              envLabel="EMAIL_FROM_NAME"
              envValue={status.envDefaults.fromName}
              enabled={draft.emailFromNameOverrideEnabled}
              value={draft.emailFromName ?? ''}
              inputType="text"
              placeholder={status.envDefaults.fromName}
              onEnabledChange={(enabled) => {
                updateDraft('emailFromNameOverrideEnabled', enabled);
                if (enabled && !draft.emailFromName) {
                  updateDraft('emailFromName', status.envDefaults.fromName);
                }
              }}
              onValueChange={(value) => updateDraft('emailFromName', value || null)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save email settings'}
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <form onSubmit={(e) => void handleTestSend(e)} className="mt-6 space-y-3 border-t border-[hsl(var(--dashboard-sidebar-border))] pt-6">
        <h3 className="text-sm font-semibold">Send test email</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={testing || !testEmail.trim()}
            className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-2 text-sm font-medium hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)] disabled:opacity-50"
          >
            {testing ? 'Sending…' : 'Send test'}
          </button>
        </div>
      </form>
    </DashboardCard>
  );
}
