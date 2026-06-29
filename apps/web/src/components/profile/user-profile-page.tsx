'use client';

import { useEffect, useState } from 'react';

import type { UserProfile } from '@community-marketplace/types';
import { Card, PageHeader } from '@community-marketplace/ui-dashboard';

import { EditProfileModal } from '@/components/profile/edit-profile-modal';
import { ProfileAvatarUpload } from '@/components/profile/profile-avatar-upload';
import { ProfileCredentialsSettings } from '@/components/profile/profile-credentials-settings';

interface UserProfilePageProps {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  onReload: () => void;
  onSaveProfile: (body: { displayName: string; bio: string }) => Promise<UserProfile>;
  emailVerified: boolean;
  phoneVerified: boolean;
  emailNote?: string | null;
  onOpenVerification?: () => void;
  editProfileDescription?: string;
  storefrontHint?: string;
}

export function UserProfilePage({
  profile,
  loading,
  error,
  onReload,
  onSaveProfile,
  emailVerified,
  phoneVerified,
  emailNote,
  onOpenVerification,
  editProfileDescription,
  storefrontHint,
}: UserProfilePageProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(profile);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  return (
    <>
      <PageHeader
        title="Profile"
        description="Your public identity and login credentials."
      />
      {loading && (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
      )}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {!loading && localProfile && (
        <div className="space-y-6">
          <Card title="Public profile">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <ProfileAvatarUpload
                  avatarUrl={localProfile.avatarUrl}
                  displayName={localProfile.displayName}
                  readOnly
                />
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-[hsl(var(--dashboard-main-fg))]">
                    {localProfile.displayName?.trim() || 'Add your display name'}
                  </p>
                  <p className="mt-1 text-[hsl(var(--dashboard-sidebar-muted))]">
                    {localProfile.bio?.trim() || 'No bio yet.'}
                  </p>
                  {storefrontHint && (
                    <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                      {storefrontHint}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="shrink-0 text-sm font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
              >
                Edit profile
              </button>
            </div>
          </Card>

          <ProfileCredentialsSettings
            profile={localProfile}
            onSaved={onReload}
            emailVerified={emailVerified}
            phoneVerified={phoneVerified}
            emailNote={emailNote}
            onOpenVerification={onOpenVerification}
          />
        </div>
      )}

      <EditProfileModal
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={localProfile}
        onSave={onSaveProfile}
        onSaved={(updated) => {
          setLocalProfile(updated);
          onReload();
        }}
        description={editProfileDescription}
      />
    </>
  );
}
