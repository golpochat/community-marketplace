'use client';

import { useRef, useState } from 'react';

import { Button } from '@community-marketplace/ui';

import { sellerService } from '@/services/marketplace.service';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/auth.store';

interface StoreLogoUploadProps {
  logoUrl?: string | null;
  storeName?: string | null;
  storeId?: string;
  onUpdated: (logoUrl: string) => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function StoreLogoUpload({ logoUrl, storeName, storeId, onUpdated }: StoreLogoUploadProps) {
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
      const nextLogoUrl = updated.avatarUrl;
      if (!nextLogoUrl) {
        throw new Error('Logo upload did not return a URL');
      }
      if (storeId) {
        await sellerService.updateStore(storeId, { logoUrl: nextLogoUrl });
      }
      useAuthStore.getState().updateUser({ avatarUrl: nextLogoUrl });
      onUpdated(nextLogoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  }

  const initials = (storeName ?? 'Store').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">Store logo</p>
      <div className="flex items-center gap-4">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="h-16 w-16 rounded-lg border object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.35)] text-sm font-medium text-[hsl(var(--dashboard-sidebar-muted))]">
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
            {uploading ? 'Uploading…' : logoUrl ? 'Change logo' : 'Upload logo'}
          </Button>
          <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Square image recommended. JPEG, PNG, or WebP up to 5 MB.
          </p>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
