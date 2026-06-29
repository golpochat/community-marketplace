'use client';

import { useRef, useState } from 'react';

import { Button } from '@community-marketplace/ui';

import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/auth.store';

interface StoreLogoUploadProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  onUpdated: (avatarUrl: string) => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function StoreLogoUpload({ avatarUrl, displayName, onUpdated }: StoreLogoUploadProps) {
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
      setError('Logo must be 5 MB or smaller.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const updated = await userService.uploadAvatar(file);
      if (updated.avatarUrl) {
        useAuthStore.getState().updateUser({ avatarUrl: updated.avatarUrl });
        onUpdated(updated.avatarUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  }

  const initials = (displayName ?? 'Store').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Store logo</p>
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="h-16 w-16 rounded-lg border object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm font-medium text-gray-400">
            {initials}
          </div>
        )}
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
            {uploading ? 'Uploading…' : avatarUrl ? 'Change logo' : 'Upload logo'}
          </Button>
          <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Square image recommended. JPEG, PNG, or WebP up to 5 MB.
          </p>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
