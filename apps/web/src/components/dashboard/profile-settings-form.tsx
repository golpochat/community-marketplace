'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button, Input, Label, cn } from '@community-marketplace/ui';
import { Card, PageHeader } from '@community-marketplace/ui-dashboard';
import type {
  CommunicationPreferences,
  NotificationPreferences,
  PrivacySettings,
  UserProfile,
  UserSettings,
} from '@community-marketplace/types';
import { formatListedAgo } from '@community-marketplace/utils';

import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Tabs } from '@/components/shared/tabs';
import { notificationsService } from '@/services/notifications.service';
import { userService } from '@/services/user.service';

type ProfileTab = 'profile' | 'account' | 'preferences';

const TEXTAREA_CLASSES =
  'flex min-h-[6rem] w-full resize-y rounded-md border border-[hsl(var(--dashboard-sidebar-border))] bg-white px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))] placeholder:text-[hsl(var(--dashboard-sidebar-muted))] focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))] disabled:cursor-not-allowed disabled:opacity-50';

function parseProfileTab(value: string | null): ProfileTab | null {
  if (value === 'profile' || value === 'account' || value === 'preferences') {
    return value;
  }
  return null;
}

interface ProfileSettingsFormProps {
  title?: string;
  description?: string;
  defaultTab?: ProfileTab;
  loadProfile?: () => Promise<UserProfile>;
  saveProfile?: (body: Record<string, unknown>) => Promise<UserProfile>;
  notificationRole?: 'BUYER' | 'SELLER';
  /** Buyer/seller only — admin accounts use platform settings elsewhere. */
  includeNotificationPreferences?: boolean;
}

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

function formatRoleLabel(role: string): string {
  return role
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function formatStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatOnOff(value: boolean | undefined): string {
  return value ? 'On' : 'Off';
}

function formatVisibility(value: PrivacySettings['profileVisibility']): string {
  switch (value) {
    case 'public':
      return 'Public';
    case 'members':
      return 'Members only';
    case 'private':
      return 'Private';
    default:
      return 'Not set';
  }
}

function formatChannel(value: CommunicationPreferences['preferredChannel']): string {
  switch (value) {
    case 'email':
      return 'Email';
    case 'sms':
      return 'SMS';
    case 'push':
      return 'Push';
    default:
      return 'Not set';
  }
}

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

function SettingsDetailList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="divide-y divide-[hsl(var(--dashboard-sidebar-border))]">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col gap-0.5 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">{item.label}</dt>
          <dd className="font-medium text-[hsl(var(--dashboard-main-fg))] sm:text-right">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function AccountInfoGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.15)] p-4"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
            {item.label}
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-[hsl(var(--dashboard-main-fg))]">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function FormField({
  id,
  label,
  children,
  className,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function NotificationToggleList({
  preferences,
  editable,
  onToggle,
}: {
  preferences: NotificationPreferences;
  editable: boolean;
  onToggle?: (key: BooleanNotificationPreferenceKey) => void;
}) {
  return (
    <ul className="divide-y divide-[hsl(var(--dashboard-sidebar-border))]">
      {NOTIFICATION_TOGGLES.map(({ key, label }) => (
        <li key={key}>
          {editable ? (
            <label className="flex cursor-pointer items-center justify-between gap-4 py-2.5 text-sm">
              <span className="text-[hsl(var(--dashboard-main-fg))]">{label}</span>
              <input
                type="checkbox"
                checked={Boolean(preferences[key])}
                onChange={() => onToggle?.(key)}
                className="h-4 w-4 shrink-0 rounded border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-accent))] focus:ring-[hsl(var(--dashboard-accent))]"
              />
            </label>
          ) : (
            <div className="flex flex-col gap-0.5 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <span className="text-[hsl(var(--dashboard-sidebar-muted))]">{label}</span>
              <span className="font-medium text-[hsl(var(--dashboard-main-fg))] sm:text-right">
                {formatOnOff(preferences[key])}
              </span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function AccountSettingsSummary({
  settings,
  showNotifications,
}: {
  settings: UserSettings;
  showNotifications: boolean;
}) {
  const { notificationPreferences, privacySettings, communicationPreferences } = settings;

  return (
    <div
      className={cn(
        'grid gap-4 md:gap-6',
        showNotifications ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2',
      )}
    >
      {showNotifications && (
        <SettingsSection title="Notifications">
          <NotificationToggleList preferences={notificationPreferences} editable={false} />
        </SettingsSection>
      )}
      <SettingsSection title="Privacy">
        <SettingsDetailList
          items={[
            { label: 'Show email on profile', value: formatOnOff(privacySettings.showEmail) },
            { label: 'Show phone on profile', value: formatOnOff(privacySettings.showPhone) },
            { label: 'Show location', value: formatOnOff(privacySettings.showLocation) },
            { label: 'Profile visibility', value: formatVisibility(privacySettings.profileVisibility) },
          ]}
        />
      </SettingsSection>
      <SettingsSection title="Communication" className={showNotifications ? 'md:col-span-2 xl:col-span-1' : undefined}>
        <SettingsDetailList
          items={[
            { label: 'Preferred channel', value: formatChannel(communicationPreferences.preferredChannel) },
            { label: 'Language', value: communicationPreferences.language?.toUpperCase() ?? 'Not set' },
            { label: 'Timezone', value: communicationPreferences.timezone ?? 'Not set' },
          ]}
        />
      </SettingsSection>
      <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))] md:col-span-2 xl:col-span-3">
        Last updated {formatListedAgo(settings.updatedAt)}
      </p>
    </div>
  );
}

const PROFILE_TABS: Array<{ id: ProfileTab; label: string }> = [
  { id: 'profile', label: 'Profile' },
  { id: 'account', label: 'Account' },
  { id: 'preferences', label: 'Preferences' },
];

export function ProfileSettingsForm({
  title = 'Settings',
  description = 'Manage your profile and preferences.',
  defaultTab = 'profile',
  loadProfile,
  saveProfile,
  notificationRole = 'BUYER',
  includeNotificationPreferences = true,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  const urlTab = parseProfileTab(searchParams.get('tab'));
  const [activeTab, setActiveTab] = useState<ProfileTab>(urlTab ?? defaultTab);

  useEffect(() => {
    const next = parseProfileTab(searchParams.get('tab'));
    if (next) setActiveTab(next);
  }, [searchParams]);

  const handleTabChange = useCallback(
    (tab: ProfileTab) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

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

  function toggleNotification(key: BooleanNotificationPreferenceKey) {
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
        <Card className="overflow-hidden">
          <Tabs
            items={PROFILE_TABS}
            activeId={activeTab}
            onChange={(id) => handleTabChange(id as ProfileTab)}
            className="border-[hsl(var(--dashboard-sidebar-border))]"
          />

          <div className="mt-6">
            {activeTab === 'profile' && (
              <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                  <FormField id="displayName" label="Display name">
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="How your name appears to others"
                    />
                  </FormField>
                  <FormField id="phone" label="Phone">
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Optional contact number"
                    />
                  </FormField>
                  <FormField id="bio" label="Bio" className="md:col-span-2">
                    <textarea
                      id="bio"
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell others a little about yourself"
                      className={TEXTAREA_CLASSES}
                    />
                  </FormField>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-[hsl(var(--dashboard-sidebar-border))] pt-6 sm:flex-row sm:items-center sm:justify-between">
                  {message ? (
                    <p className="text-sm text-green-700">{message}</p>
                  ) : (
                    <span className="hidden sm:block" aria-hidden />
                  )}
                  <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                    {saving ? 'Saving…' : 'Save profile'}
                  </Button>
                </div>
                {message && <p className="text-sm text-green-700 sm:hidden">{message}</p>}
              </form>
            )}

            {activeTab === 'account' && (
              <AccountInfoGrid
                items={[
                  { label: 'Email', value: profile.email },
                  { label: 'Role', value: formatRoleLabel(profile.role) },
                  { label: 'Status', value: formatStatusLabel(profile.status) },
                ]}
              />
            )}

            {activeTab === 'preferences' && settings && (
              <div className="space-y-6">
                {notificationPreferences && includeNotificationPreferences ? (
                  <div className="grid gap-6 xl:grid-cols-2">
                    <SettingsSection title="Notifications">
                      <NotificationToggleList
                        preferences={notificationPreferences}
                        editable
                        onToggle={toggleNotification}
                      />
                      <div className="mt-4 flex flex-col gap-3 border-t border-[hsl(var(--dashboard-sidebar-border))] pt-4 sm:flex-row sm:items-center sm:justify-between">
                        {notificationMessage ? (
                          <p className="text-sm text-green-700">{notificationMessage}</p>
                        ) : (
                          <span className="hidden sm:block" aria-hidden />
                        )}
                        <Button
                          type="button"
                          disabled={savingNotifications}
                          onClick={() => void handleSaveNotifications()}
                          className="w-full sm:w-auto"
                        >
                          {savingNotifications ? 'Saving…' : 'Save notification preferences'}
                        </Button>
                      </div>
                      {notificationMessage && (
                        <p className="mt-2 text-sm text-green-700 sm:hidden">{notificationMessage}</p>
                      )}
                    </SettingsSection>
                    <AccountSettingsSummary settings={settings} showNotifications={false} />
                  </div>
                ) : (
                  <AccountSettingsSummary
                    settings={settings}
                    showNotifications={!includeNotificationPreferences}
                  />
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  );
}
