'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import type { RbacRole, UserProfile } from '@community-marketplace/types';
import { isPrivilegedSystemRole } from '@community-marketplace/types';
import { Input, Label } from '@community-marketplace/ui';
import { Card } from '@community-marketplace/ui-dashboard';

import { LoadingState } from '@/components/LoadingState';
import { PhoneChangePanel } from '@/components/seller/profile/phone-change-panel';
import { ContactVerifiedBadge } from '@/components/trust/contact-verified-badge';
import { userService } from '@/services/user.service';

function isStaffRole(role?: RbacRole | string): boolean {
  return role !== undefined && (role === 'SUPER_ADMIN' || isPrivilegedSystemRole(role));
}

export interface ProfileCredentialsSettingsProps {
  profile: UserProfile | null;
  onSaved?: () => void;
  emailVerified: boolean;
  phoneVerified: boolean;
  emailNote?: string | null;
  onOpenVerification?: () => void;
}

export function ProfileCredentialsSettings({
  profile: initialProfile,
  onSaved,
  emailVerified,
  phoneVerified,
  emailNote,
  onOpenVerification,
}: ProfileCredentialsSettingsProps) {
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [deactivating, setDeactivating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  async function handleDeactivate() {
    if (
      !window.confirm(
        'Request account deactivation? Your account will be scheduled for closure. Support will process your request within 30 days.',
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
    return <LoadingState />;
  }

  const staff = isStaffRole(profile.role);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {error && <p className="text-sm text-destructive lg:col-span-2">{error}</p>}
      {message && <p className="text-sm text-emerald-700 lg:col-span-2">{message}</p>}

      <Card title="Login & contact">
        <p className="mb-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          Private account details used to sign in and receive notifications.
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              value={profile.email}
              readOnly
              disabled
              className="bg-muted/50 text-muted-foreground"
            />
            {emailNote && (
              <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{emailNote}</p>
            )}
            <div className="mt-2">
              <ContactVerifiedBadge verified={emailVerified} label="Email" />
            </div>
          </div>

          <PhoneChangePanel
            currentPhone={profile.phone ?? ''}
            phoneVerified={phoneVerified}
            onOpenVerification={onOpenVerification}
            onPhoneUpdated={(phone) => {
              setProfile((current) => (current ? { ...current, phone } : current));
              setMessage('Phone number updated.');
              onSaved?.();
            }}
          />
        </div>
      </Card>

      {staff ? (
        <Card title="Security">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">Password</h4>
              <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                To change your password, sign out and use the password reset option on the login page.
              </p>
              <Link
                href="/auth/login"
                className="mt-2 inline-block text-sm font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
              >
                Go to login →
              </Link>
            </div>
            <div className="border-t border-[hsl(var(--dashboard-sidebar-border))] pt-6">
              <h4 className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">Platform account</h4>
              <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                {profile.role === 'SUPER_ADMIN'
                  ? 'Super Admin accounts manage the platform and cannot be self-deactivated. To step down, assign another Super Admin first, then have them revoke your role under User management.'
                  : 'Admin accounts cannot be self-deactivated from this page. Ask a Super Admin to revoke your admin role under User management if you no longer need platform access.'}
              </p>
            </div>
          </div>
        </Card>
      ) : (
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
              className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              {deactivating ? 'Submitting…' : 'Request account deactivation'}
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
