interface StoreBannerProps {
  bannerUrl?: string;
  name: string;
}

export function StoreBanner({ bannerUrl, name }: StoreBannerProps) {
  if (bannerUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={bannerUrl} alt={`${name} banner`} className="h-40 w-full object-cover sm:h-56" />
    );
  }

  return (
    <div className="h-40 w-full bg-gradient-to-r from-primary/20 to-primary/5 sm:h-56" aria-hidden />
  );
}
