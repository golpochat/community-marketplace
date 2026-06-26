'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button, Input, Label } from '@community-marketplace/ui';
import { Card, PageHeader } from '@community-marketplace/ui-dashboard';
import type { NotificationPreferences, UserProfile, UserSettings } from '@community-marketplace/types';

import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { notificationsService } from '@/services/notifications.service';
import { userService } from '@/services/user.service';

interface ProfileSettingsFormProps {
  title?: string;
  description?: string;
  loadProfile?: () => Promise<UserProfile>;
  saveProfile?: (body: Record<string, unknown>) => Promise<UserProfile>;
  notificationRole?: 'BUYER' | 'SELLER';
  /** Buyer/seller only — admin accounts use platform settings elsewhere. */
  includeNotificationPreferences?: boolean;
}

const NOTIFICATION_TOGGLES: Array<{ key: keyof NotificationPreferences; label: string }> = [
  { key: 'email', label: 'Email notifications' },
  { key: 'push', label: 'Push notifications' },
  { key: 'inApp', label: 'In-app notifications' },
  { key: 'sms', label: 'SMS notifications' },
  { key: 'marketing', label: 'Marketing updates' },
  { key: 'listingUpdates', label: 'Listing updates' },
  { key: 'messageAlerts', label: 'Message alerts' },
];

export function ProfileSettingsForm({
  title = 'Settings',
  description = 'Manage your profile and preferences.',
  loadProfile,
  saveProfile,
  notificationRole = 'BUYER',
  includeNotificationPreferences = true,
}: ProfileSettingsFormProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileData, settingsData] = await Promise.all([
        loadProfile ? loadProfile() : userService.getMyProfile(),
        userService.getMySettings(),
      ]);
      let preferencesData: NotificationPreferences | null = null;
      if (includeNotificationPreferences) {
        preferencesData = (await notificationsService.getPreferences(notificationRole)) ?? {};
      }
      setProfile(profileData);
      setSettings(settingsData);
      setNotificationPreferences(preferencesData);
      setDisplayName(profileData.displayName ?? '');
      setBio(profileData.bio ?? '');
      setPhone(profileData.phone ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [loadProfile, notificationRole, includeNotificationPreferences]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = saveProfile
        ? await saveProfile({ displayName, bio, phone })
        : await userService.updateMyProfile({ displayName, bio, phone });
      setProfile(updated);
      setMessage('Profile saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNotifications() {
    if (!notificationPreferences) return;
    setSavingNotifications(true);
    setError(null);
    setNotificationMessage(null);
    try {
      const updated = await notificationsService.updatePreferences(
        notificationPreferences,
        notificationRole,
      );
      setNotificationPreferences(updated ?? notificationPreferences);
      setNotificationMessage('Notification preferences saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notification preferences');
    } finally {
      setSavingNotifications(false);
    }
  }

  function toggleNotification(key: keyof NotificationPreferences) {
    setNotificationPreferences((current) => ({
      ...current,
      [key]: !current?.[key],
    }));
  }

  return (
    <>
      <PageHeader title={title} description={description} />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && profile && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Profile">
            <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
              <div>
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Input id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save profile'}
              </Button>
              {message && <p className="text-sm text-green-700">{message}</p>}
            </form>
          </Card>
          <div className="space-y-6">
            <Card title="Account">
              <dl className="space-y-2 text-sm text-[hsl(var(--dashboard-main-fg))]">
                <div className="flex justify-between">
                  <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Email</dt>
                  <dd>{profile.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Role</dt>
                  <dd>{profile.role}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Status</dt>
                  <dd>{profile.status}</dd>
                </div>
              </dl>
              {settings && (
                <pre className="mt-4 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-900">
                  {JSON.stringify(settings, null, 2)}
                </pre>
              )}
            </Card>
            {notificationPreferences && includeNotificationPreferences && (
              <Card title="Notifications">
                <div className="space-y-3">
                  {NOTIFICATION_TOGGLES.map(({ key, label }) => (
                    <label key={key} className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-[hsl(var(--dashboard-main-fg))]">{label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(notificationPreferences[key])}
                        onChange={() => toggleNotification(key)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </label>
                  ))}
                </div>
                <Button
                  type="button"
                  className="mt-4"
                  disabled={savingNotifications}
                  onClick={() => void handleSaveNotifications()}
                >
                  {savingNotifications ? 'Saving…' : 'Save notification preferences'}
                </Button>
                {notificationMessage && (
                  <p className="mt-2 text-sm text-green-700">{notificationMessage}</p>
                )}
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );
}
