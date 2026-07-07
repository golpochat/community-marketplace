import { BrandMediaImage, cn } from '@community-marketplace/ui';

interface StoreBannerPhotoProps {
  src: string;
  className?: string;
}

export function StoreBannerPhoto({ src, className }: StoreBannerPhotoProps) {
  return (
    <BrandMediaImage
      src={src}
      alt="Store banner"
      rounded="none"
      className={cn('absolute inset-0 h-full w-full object-cover object-center', className)}
    />
  );
}
