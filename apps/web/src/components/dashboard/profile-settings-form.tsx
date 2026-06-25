'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button, Input, Label } from '@community-marketplace/ui';
import { Card, PageHeader } from '@community-marketplace/ui-dashboard';
import type { UserProfile, UserSettings } from '@community-marketplace/types';

import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { userService } from '@/services/user.service';

interface ProfileSettingsFormProps {
  title?: string;
  description?: string;
  loadProfile?: () => Promise<UserProfile>;
  saveProfile?: (body: Record<string, unknown>) => Promise<UserProfile>;
}

export function ProfileSettingsForm({
  title = 'Settings',
  description = 'Manage your profile and preferences.',
  loadProfile,
  saveProfile,
}: ProfileSettingsFormProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileData, settingsData] = await Promise.all([
        loadProfile ? loadProfile() : userService.getMyProfile(),
        userService.getMySettings(),
      ]);
      setProfile(profileData);
      setSettings(settingsData);
      setDisplayName(profileData.displayName ?? '');
      setBio(profileData.bio ?? '');
      setPhone(profileData.phone ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

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
        </div>
      )}
    </>
  );
}
