'use client';

import { useRef, useState } from 'react';

import { Button } from '@community-marketplace/ui';

import { StoreBannerPhoto } from '@/components/storefront/store-banner-photo';
import { STOREFRONT_HERO_BANNER_CLASS } from '@/components/storefront/storefront-layout';
import { prepareStoreBannerImage } from '@/lib/store-banner-image';
import { sellerService } from '@/services/marketplace.service';
import { userService } from '@/services/user.service';

interface StoreBannerUploadProps {
  bannerUrl?: string | null;
  storeId?: string;
  onUpdated: (bannerUrl: string) => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function StoreBannerUpload({ bannerUrl, storeId, onUpdated }: StoreBannerUploadProps) {
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

    if (file.size > 8 * 1024 * 1024) {
      setError('Banner must be 8 MB or smaller.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const prepared = await prepareStoreBannerImage(file);
      const updated = await userService.uploadStoreBanner(prepared);
      const nextBannerUrl = updated.storeBannerUrl;
      if (!nextBannerUrl) {
        throw new Error('Banner upload did not return a URL');
      }
      if (storeId) {
        await sellerService.updateStore(storeId, { bannerUrl: nextBannerUrl });
      }
      onUpdated(nextBannerUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload banner');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">Storefront hero banner</p>
      <div className={`relative overflow-hidden rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.35)] ${STOREFRONT_HERO_BANNER_CLASS}`}>
          {bannerUrl ? (
            <StoreBannerPhoto src={bannerUrl} />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[hsl(var(--dashboard-sidebar-active)/0.5)] via-[hsl(var(--dashboard-sidebar-active)/0.35)] to-primary/5 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
              No banner yet
            </div>
          )}
      </div>
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
          {uploading ? 'Uploading…' : bannerUrl ? 'Change banner' : 'Upload banner'}
        </Button>
        <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          Any landscape photo works — we automatically center-crop and resize to fit the hero
          (1600×400). For best quality use at least 1200px wide. Use the store logo field below for
          your square logo, not here.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
