import { getInitials } from '@community-marketplace/utils';
import { Store } from 'lucide-react';

interface StoreBannerProps {
  bannerUrl?: string;
  name: string;
}

export function StoreBanner({ bannerUrl, name }: StoreBannerProps) {
  if (bannerUrl) {
    return (
      <div className="relative h-44 w-full overflow-hidden sm:h-52 md:h-60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"
          aria-hidden
        />
      </div>
    );
  }

  const initials = getInitials(name);

  return (
    <div
      className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-brand-50 sm:h-52 md:h-60"
      role="img"
      aria-label={`${name} store banner placeholder`}
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
        <span className="select-none text-7xl font-bold tracking-tight text-brand-600/10 sm:text-8xl md:text-[10rem]">
          {initials}
        </span>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-500 shadow-brand-sm backdrop-blur-sm">
        <Store className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
        <span>Storefront</span>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent" aria-hidden />
    </div>
  );
}
