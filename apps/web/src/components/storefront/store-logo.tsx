import { Avatar } from '@/components/shared/avatar';

interface StoreLogoProps {
  logoUrl?: string;
  name: string;
}

export function StoreLogo({ logoUrl, name }: StoreLogoProps) {
  return (
    <div className="relative z-10 rounded-xl border-4 border-white bg-white shadow-md">
      <Avatar name={name} src={logoUrl} size="lg" className="h-24 w-24 sm:h-28 sm:w-28" />
    </div>
  );
}
