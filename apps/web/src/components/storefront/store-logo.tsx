import { getInitials } from '@community-marketplace/utils';

import { STOREFRONT_LOGO_SIZE_CLASS } from './storefront-layout';

interface StoreLogoProps {
  logoUrl?: string;
  name: string;
  className?: string;
}

export function StoreLogo({ logoUrl, name, className = '' }: StoreLogoProps) {
  const initials = getInitials(name);

  return (
    <div
      className={`relative z-10 shrink-0 overflow-hidden rounded-full border-4 border-white bg-white shadow-md ${STOREFRONT_LOGO_SIZE_CLASS} ${className}`}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-brand-50 text-xl font-bold text-brand-700 sm:text-2xl">
          {initials}
        </div>
      )}
    </div>
  );
}
