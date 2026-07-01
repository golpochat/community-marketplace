'use client';

import { useCallback, useEffect, useState } from 'react';

import type { UserProfile } from '@community-marketplace/types';
import { Button, Input, Label } from '@community-marketplace/ui';

import { ProfileAvatarUpload } from '@/components/profile/profile-avatar-upload';
import { Modal } from '@/components/shared/modal';
import { useAuthStore } from '@/store/auth.store';

const TEXTAREA_CLASSES =
  'flex min-h-[6rem] w-full resize-y rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))]';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile | null;
  onSave: (body: { displayName: string; bio: string }) => Promise<UserProfile>;
  onSaved?: (profile: UserProfile) => void;
  description?: string;
}

export function EditProfileModal({
  open,
  onOpenChange,
  profile,
  onSave,
  onSaved,
  description = 'Update how your name and bio appear to others.',
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && profile) {
      setDisplayName(profile.displayName ?? '');
      setBio(profile.bio ?? '');
      setAvatarUrl(profile.avatarUrl);
      setError(null);
    }
  }, [open, profile]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await onSave({ displayName, bio });
      useAuthStore.getState().updateUser({
        displayName: updated.displayName,
        avatarUrl: avatarUrl ?? updated.avatarUrl,
      });
      onSaved?.({ ...updated, avatarUrl: avatarUrl ?? updated.avatarUrl });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }, [avatarUrl, bio, displayName, onOpenChange, onSave, onSaved]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit profile"
      description={description}
      cancelLabel="Cancel"
    >
      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
      <div className="space-y-4">
        <ProfileAvatarUpload
          avatarUrl={avatarUrl}
          displayName={displayName || profile?.displayName}
          onUpdated={(url) => {
            setAvatarUrl(url);
            if (profile) {
              onSaved?.({ ...profile, avatarUrl: url });
            }
          }}
        />
        <div>
          <Label htmlFor="edit-profile-display-name">Display name</Label>
          <Input
            id="edit-profile-display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How your name appears to others"
          />
        </div>
        <div>
          <Label htmlFor="edit-profile-bio">Bio</Label>
          <textarea
            id="edit-profile-bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others a little about yourself"
            className={TEXTAREA_CLASSES}
          />
        </div>
        <div className="flex justify-end">
          <Button type="button" disabled={saving} onClick={() => void handleSave()}>
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
