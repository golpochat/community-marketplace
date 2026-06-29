'use client';

import { useCallback, useEffect, useState } from 'react';

import type {
  CommunicationPreferences,
  NotificationPreferences,
  PrivacySettings,
  UserSettings,
} from '@community-marketplace/types';
import { Button, Input, Label, Select, cn } from '@community-marketplace/ui';
import { Card, PageHeader } from '@community-marketplace/ui-dashboard';
import { formatListedAgo } from '@community-marketplace/utils';

import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { userService } from '@/services/user.service';

type BooleanNotificationPreferenceKey = Exclude<keyof NotificationPreferences, 'events'>;

const NOTIFICATION_TOGGLES: Array<{ key: BooleanNotificationPreferenceKey; label: string }> = [
  { key: 'email', label: 'Email notifications' },
  { key: 'push', label: 'Push notifications' },
  { key: 'inApp', label: 'In-app notifications' },
  { key: 'sms', label: 'SMS notifications' },
  { key: 'marketing', label: 'Marketing updates' },
  { key: 'listingUpdates', label: 'Listing updates' },
  { key: 'messageAlerts', label: 'Message alerts' },
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

interface UserSettingsFormProps {
  title?: string;
  description?: string;
}

export function UserSettingsForm({
  title = 'Settings',
  description = 'Notification, privacy, and communication preferences.',
}: UserSettingsFormProps) {
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

  function updateNotifications(key: BooleanNotificationPreferenceKey) {
    setSettings((current) =>
      current
        ? {
            ...current,
            notificationPreferences: {
              ...current.notificationPreferences,
              [key]: !current.notificationPreferences[key],
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

  return (
    <>
      <PageHeader title={title} description={description} />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && settings && (
        <Card className="overflow-hidden">
          <div className="grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
            <SettingsSection title="Notifications">
              <ul className="divide-y divide-[hsl(var(--dashboard-sidebar-border))]">
                {NOTIFICATION_TOGGLES.map(({ key, label }) => (
                  <li key={key}>
                    <label className="flex cursor-pointer items-center justify-between gap-4 py-2.5 text-sm">
                      <span className="text-[hsl(var(--dashboard-main-fg))]">{label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(settings.notificationPreferences[key])}
                        onChange={() => updateNotifications(key)}
                        className="h-4 w-4 shrink-0 rounded border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-accent))] focus:ring-[hsl(var(--dashboard-accent))]"
                      />
                    </label>
                  </li>
                ))}
              </ul>
            </SettingsSection>

            <SettingsSection title="Privacy">
              <div className="space-y-4">
                <label className="flex cursor-pointer items-center justify-between gap-4 text-sm">
                  <span className="text-[hsl(var(--dashboard-main-fg))]">Show email on profile</span>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.privacySettings.showEmail)}
                    onChange={() => updatePrivacy('showEmail', !settings.privacySettings.showEmail)}
                    className="h-4 w-4 shrink-0 rounded border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-accent))] focus:ring-[hsl(var(--dashboard-accent))]"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-4 text-sm">
                  <span className="text-[hsl(var(--dashboard-main-fg))]">Show phone on profile</span>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.privacySettings.showPhone)}
                    onChange={() => updatePrivacy('showPhone', !settings.privacySettings.showPhone)}
                    className="h-4 w-4 shrink-0 rounded border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-accent))] focus:ring-[hsl(var(--dashboard-accent))]"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-4 text-sm">
                  <span className="text-[hsl(var(--dashboard-main-fg))]">Show location</span>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.privacySettings.showLocation)}
                    onChange={() => updatePrivacy('showLocation', !settings.privacySettings.showLocation)}
                    className="h-4 w-4 shrink-0 rounded border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-accent))] focus:ring-[hsl(var(--dashboard-accent))]"
                  />
                </label>
                <div>
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
              </div>
            </SettingsSection>

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
                  <Input
                    id="language"
                    className="mt-1.5"
                    value={settings.communicationPreferences.language ?? ''}
                    onChange={(e) => updateCommunication('language', e.target.value)}
                    placeholder="en"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    className="mt-1.5"
                    value={settings.communicationPreferences.timezone ?? ''}
                    onChange={(e) => updateCommunication('timezone', e.target.value)}
                    placeholder="Europe/Dublin"
                  />
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
