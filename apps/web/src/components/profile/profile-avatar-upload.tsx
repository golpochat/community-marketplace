'use client';

import { useRef, useState } from 'react';

import { Button, BrandAvatar } from '@community-marketplace/ui';

import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/auth.store';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ProfileAvatarUploadProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  onUpdated?: (avatarUrl: string) => void;
  label?: string;
  hint?: string;
  readOnly?: boolean;
}

export function ProfileAvatarUpload({
  avatarUrl,
  displayName,
  onUpdated,
  label = 'Profile photo',
  hint = 'Square image recommended. JPEG, PNG, or WebP up to 5 MB.',
  readOnly = false,
}: ProfileAvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Use a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5 MB or smaller.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const updated = await userService.uploadAvatar(file);
      if (updated.avatarUrl) {
        useAuthStore.getState().updateUser({ avatarUrl: updated.avatarUrl });
        onUpdated?.(updated.avatarUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  }

  const displayLabel = displayName?.trim() || 'User';

  return (
    <div className="space-y-2">
      {!readOnly && (
        <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">{label}</p>
      )}
      <div className="flex items-center gap-4">
        <BrandAvatar
          src={avatarUrl}
          alt={displayLabel}
          size="2xl"
          className="border border-[hsl(var(--dashboard-sidebar-border))]"
        />
        {!readOnly && (
          <div className="space-y-2">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => void handleFileChange(e)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Upload photo'}
            </Button>
            <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{hint}</p>
          </div>
        )}
      </div>
      {!readOnly && error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
