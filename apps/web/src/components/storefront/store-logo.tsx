import { BrandMediaImage } from '@community-marketplace/ui';

import { STOREFRONT_LOGO_SIZE_CLASS } from './storefront-layout';

interface StoreLogoProps {
  logoUrl?: string;
  name: string;
  className?: string;
}

export function StoreLogo({ logoUrl, name, className = '' }: StoreLogoProps) {
  return (
    <div
      className={`relative z-10 shrink-0 overflow-hidden rounded-full border-4 border-white bg-card shadow-md ${STOREFRONT_LOGO_SIZE_CLASS} ${className}`}
    >
      <BrandMediaImage src={logoUrl} alt={name} rounded="full" className="h-full w-full" />
    </div>
  );
}
