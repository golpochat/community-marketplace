import { getInitials } from '@community-marketplace/utils';
import { Store } from 'lucide-react';

import { StoreBannerPhoto } from '@/components/storefront/store-banner-photo';
import { STOREFRONT_HERO_BANNER_CLASS } from './storefront-layout';

interface StoreBannerProps {
  bannerUrl?: string;
  name: string;
}

function StorefrontBadge() {
  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm backdrop-blur-sm">
      <Store className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
      <span>Storefront</span>
    </div>
  );
}

export function StoreBanner({ bannerUrl, name }: StoreBannerProps) {
  if (bannerUrl) {
    return (
      <div className={`relative overflow-hidden bg-slate-200 ${STOREFRONT_HERO_BANNER_CLASS}`}>
        <StoreBannerPhoto src={bannerUrl} />
        <div className="absolute inset-0 bg-slate-900/5" aria-hidden />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/50 to-transparent"
          aria-hidden
        />
        <StorefrontBadge />
      </div>
    );
  }

  const initials = getInitials(name);

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-brand-50 ${STOREFRONT_HERO_BANNER_CLASS}`}
      role="img"
      aria-label={`${name} store banner`}
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgb(148_163_184/0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgb(148_163_184/0.12)_1px,transparent_1px)] bg-[size:28px_28px]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgb(59_130_246/0.08),transparent_55%)]"
        aria-hidden
      />
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <span className="select-none text-7xl font-bold tracking-tight text-brand-600/10 sm:text-8xl">
          {initials}
        </span>
      </div>
      <StorefrontBadge />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/70 to-transparent"
        aria-hidden
      />
    </div>
  );
}
