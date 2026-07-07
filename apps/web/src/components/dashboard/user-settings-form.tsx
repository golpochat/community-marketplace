'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  CommunicationPreferences,
  NotificationPreferences,
  PrivacySettings,
  UserSettings,
} from '@community-marketplace/types';
import { Button, Label, Select, cn } from '@community-marketplace/ui';
import { Card, PageHeader } from '@community-marketplace/ui-dashboard';
import { formatListedAgo } from '@community-marketplace/utils';

import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { LANGUAGE_OPTIONS, TIMEZONE_OPTIONS } from '@/lib/settings-options';
import { userService } from '@/services/user.service';

type BooleanNotificationPreferenceKey = Exclude<keyof NotificationPreferences, 'events'>;
type UserSettingsVariant = 'marketplace' | 'staff';

const MARKETPLACE_NOTIFICATION_TOGGLES: Array<{
  key: BooleanNotificationPreferenceKey;
  label: string;
}> = [
  { key: 'email', label: 'Email notifications' },
  { key: 'push', label: 'Push notifications' },
  { key: 'inApp', label: 'In-app notifications' },
  { key: 'sms', label: 'SMS notifications' },
  { key: 'marketing', label: 'Marketing updates' },
  { key: 'listingUpdates', label: 'Listing updates' },
  { key: 'messageAlerts', label: 'Message alerts' },
];

const STAFF_NOTIFICATION_TOGGLES: Array<{
  key: BooleanNotificationPreferenceKey;
  label: string;
}> = [
  { key: 'email', label: 'Email notifications' },
  { key: 'push', label: 'Push notifications' },
  { key: 'inApp', label: 'In-app notifications' },
  { key: 'sms', label: 'SMS notifications' },
];

function SettingsSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.15)] p-4 md:p-5',
        className,
      )}
    >
      <h3 className="mb-3 text-sm font-semibold text-[hsl(var(--dashboard-main-fg))]">{title}</h3>
      {children}
    </section>
  );
}

function SettingsToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <span className="text-[hsl(var(--dashboard-main-fg))]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--dashboard-accent))] focus:ring-offset-2',
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
    </div>
  );
}

interface UserSettingsFormProps {
  title?: string;
  description?: string;
  variant?: UserSettingsVariant;
}

export function UserSettingsForm({
  title = 'Settings',
  description,
  variant = 'marketplace',
}: UserSettingsFormProps) {
  const isStaff = variant === 'staff';
  const resolvedDescription =
    description ??
    (isStaff
      ? 'Your personal notification and communication preferences — not platform-wide configuration.'
      : 'Notification, privacy, and communication preferences.');

  const notificationToggles = useMemo(
    () => (isStaff ? STAFF_NOTIFICATION_TOGGLES : MARKETPLACE_NOTIFICATION_TOGGLES),
    [isStaff],
  );

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSettings(await userService.getMySettings());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updateNotifications(key: BooleanNotificationPreferenceKey, value: boolean) {
    setSettings((current) =>
      current
        ? {
            ...current,
            notificationPreferences: {
              ...current.notificationPreferences,
              [key]: value,
            },
          }
        : current,
    );
  }

  function updatePrivacy(key: keyof PrivacySettings, value: boolean | PrivacySettings['profileVisibility']) {
    setSettings((current) =>
      current
        ? {
            ...current,
            privacySettings: { ...current.privacySettings, [key]: value },
          }
        : current,
    );
  }

  function updateCommunication<K extends keyof CommunicationPreferences>(
    key: K,
    value: CommunicationPreferences[K],
  ) {
    setSettings((current) =>
      current
        ? {
            ...current,
            communicationPreferences: { ...current.communicationPreferences, [key]: value },
          }
        : current,
    );
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await userService.updateMySettings({
        notificationPreferences: settings.notificationPreferences,
        privacySettings: settings.privacySettings,
        communicationPreferences: settings.communicationPreferences,
      });
      setSettings(updated);
      setMessage('Settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  const languageValue = settings?.communicationPreferences.language ?? 'en';
  const timezoneValue = settings?.communicationPreferences.timezone ?? 'Europe/Dublin';

  const languageOptions = LANGUAGE_OPTIONS.some((option) => option.value === languageValue)
    ? LANGUAGE_OPTIONS
    : [...LANGUAGE_OPTIONS, { value: languageValue, label: languageValue }];

  const timezoneOptions = TIMEZONE_OPTIONS.some((option) => option.value === timezoneValue)
    ? TIMEZONE_OPTIONS
    : [...TIMEZONE_OPTIONS, { value: timezoneValue, label: timezoneValue }];

  return (
    <>
      <PageHeader title={title} description={resolvedDescription} />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && settings && (
        <Card className="overflow-hidden">
          <div
            className={cn(
              'grid gap-4 md:gap-6',
              isStaff ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3',
            )}
          >
            <SettingsSection title="Notifications">
              <ul className="divide-y divide-[hsl(var(--dashboard-sidebar-border))]">
                {notificationToggles.map(({ key, label }) => (
                  <li key={key}>
                    <SettingsToggle
                      label={label}
                      checked={Boolean(settings.notificationPreferences[key])}
                      onChange={(value) => updateNotifications(key, value)}
                    />
                  </li>
                ))}
              </ul>
            </SettingsSection>

            {!isStaff ? (
              <SettingsSection title="Privacy">
                <div className="space-y-1 divide-y divide-[hsl(var(--dashboard-sidebar-border))]">
                  <SettingsToggle
                    label="Show email on profile"
                    checked={Boolean(settings.privacySettings.showEmail)}
                    onChange={(value) => updatePrivacy('showEmail', value)}
                  />
                  <SettingsToggle
                    label="Show phone on profile"
                    checked={Boolean(settings.privacySettings.showPhone)}
                    onChange={(value) => updatePrivacy('showPhone', value)}
                  />
                  <SettingsToggle
                    label="Show location"
                    checked={Boolean(settings.privacySettings.showLocation)}
                    onChange={(value) => updatePrivacy('showLocation', value)}
                  />
                </div>
                <div className="mt-4">
                  <Label htmlFor="profile-visibility">Profile visibility</Label>
                  <Select
                    id="profile-visibility"
                    className="mt-1.5"
                    value={settings.privacySettings.profileVisibility ?? 'members'}
                    onChange={(e) =>
                      updatePrivacy(
                        'profileVisibility',
                        e.target.value as PrivacySettings['profileVisibility'],
                      )
                    }
                  >
                    <option value="public">Public</option>
                    <option value="members">Members only</option>
                    <option value="private">Private</option>
                  </Select>
                </div>
              </SettingsSection>
            ) : null}

            <SettingsSection title="Communication">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="preferred-channel">Preferred channel</Label>
                  <Select
                    id="preferred-channel"
                    className="mt-1.5"
                    value={settings.communicationPreferences.preferredChannel ?? 'email'}
                    onChange={(e) =>
                      updateCommunication(
                        'preferredChannel',
                        e.target.value as CommunicationPreferences['preferredChannel'],
                      )
                    }
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    id="language"
                    className="mt-1.5"
                    value={languageValue}
                    onChange={(e) => updateCommunication('language', e.target.value)}
                  >
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    id="timezone"
                    className="mt-1.5"
                    value={timezoneValue}
                    onChange={(e) => updateCommunication('timezone', e.target.value)}
                  >
                    {timezoneOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </SettingsSection>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[hsl(var(--dashboard-sidebar-border))] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Last updated {formatListedAgo(settings.updatedAt)}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {message && <p className="text-sm text-green-700">{message}</p>}
              <Button type="button" disabled={saving} onClick={() => void handleSave()}>
                {saving ? 'Saving…' : 'Save settings'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
