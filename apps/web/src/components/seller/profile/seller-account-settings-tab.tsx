'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import type { SellerVerificationStatus, UserProfile } from '@community-marketplace/types';
import { Button, Input, Label } from '@community-marketplace/ui';
import { Card } from '@community-marketplace/ui-dashboard';

import { sellerService } from '@/services/marketplace.service';
import { userService } from '@/services/user.service';

interface SellerAccountSettingsTabProps {
  profile: UserProfile | null;
  verification: SellerVerificationStatus | null;
  onProfileSaved?: () => void;
  onOpenVerification?: () => void;
}

export function SellerAccountSettingsTab({
  profile: initialProfile,
  verification,
  onProfileSaved,
  onOpenVerification,
}: SellerAccountSettingsTabProps) {
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProfile(initialProfile);
    if (initialProfile) {
      setDisplayName(initialProfile.displayName ?? '');
      setPhone(initialProfile.phone ?? '');
      setBio(initialProfile.bio ?? '');
      setLocationLabel(initialProfile.location?.label ?? '');
    }
  }, [initialProfile]);

  const emailReadOnly = verification?.sellerStatus === 'verified';

  const handleSave = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setSaving(true);
      setError(null);
      setMessage(null);
      try {
        const updated = await sellerService.updateProfile({
          displayName,
          bio,
          phone,
          location: locationLabel.trim()
            ? { label: locationLabel.trim() }
            : undefined,
        });
        setProfile(updated);
        setMessage('Account settings saved.');
        onProfileSaved?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save settings');
      } finally {
        setSaving(false);
      }
    },
    [bio, displayName, locationLabel, onProfileSaved, phone],
  );

  async function handleDeactivate() {
    if (
      !window.confirm(
        'Request account deactivation? Your account will be scheduled for deactivation — listings may be hidden and you will lose access after processing.',
      )
    ) {
      return;
    }
    setDeactivating(true);
    setError(null);
    setMessage(null);
    try {
      const result = await userService.requestAccountDeactivation();
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request deactivation');
    } finally {
      setDeactivating(false);
    }
  }

  if (!profile) {
    return <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading account…</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {error && <p className="text-sm text-red-600 lg:col-span-2">{error}</p>}
      {message && <p className="text-sm text-emerald-700 lg:col-span-2">{message}</p>}

      <Card title="Profile">
        <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
          <div>
            <Label htmlFor="seller-display-name">Name</Label>
            <Input
              id="seller-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="seller-email">Email</Label>
            <Input
              id="seller-email"
              value={profile.email}
              readOnly={emailReadOnly}
              disabled={emailReadOnly}
              className={emailReadOnly ? 'bg-gray-50 text-gray-600' : undefined}
            />
            {emailReadOnly && (
              <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                Email cannot be changed after seller verification.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="seller-phone">Phone</Label>
            <Input
              id="seller-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  verification?.phoneVerified
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {verification?.phoneVerified ? 'Verified' : 'Unverified'}
              </span>
              {!verification?.phoneVerified && onOpenVerification && (
                <button
                  type="button"
                  onClick={onOpenVerification}
                  className="text-xs font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
                >
                  Verify phone
                </button>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="seller-bio">Store description</Label>
            <Input id="seller-bio" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="seller-location">Store location</Label>
            <Input
              id="seller-location"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Card>

      <div className="space-y-6">
        <Card title="Password">
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            To change your password, sign out and use the password reset option on the login page.
          </p>
          <Link
            href="/auth/login"
            className="mt-3 inline-block text-sm font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
          >
            Go to login →
          </Link>
        </Card>

        <Card title="Deactivate account">
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Deactivation schedules your account for closure. This is not immediate permanent
            deletion — support will process your request within 30 days.
          </p>
          <button
            type="button"
            onClick={() => void handleDeactivate()}
            disabled={deactivating}
            className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deactivating ? 'Submitting…' : 'Request account deactivation'}
          </button>
        </Card>
      </div>
    </div>
  );
}
