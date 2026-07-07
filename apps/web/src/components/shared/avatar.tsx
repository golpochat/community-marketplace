import { BrandAvatar, type BrandAvatarSize } from '@community-marketplace/ui';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap: Record<NonNullable<AvatarProps['size']>, BrandAvatarSize> = {
  sm: 'sm',
  md: 'lg',
  lg: 'xl',
};

/** @deprecated Prefer BrandAvatar from @community-marketplace/ui */
export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  return (
    <BrandAvatar
      src={src}
      alt={name ?? 'User avatar'}
      size={sizeMap[size]}
      className={className}
    />
  );
}
