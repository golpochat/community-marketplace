import { cn } from '@community-marketplace/ui';

export const TABLE_TITLE_MAX_LENGTH = 55;

export interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export function TruncatedText({
  text,
  maxLength = TABLE_TITLE_MAX_LENGTH,
  className,
}: TruncatedTextProps) {
  const trimmed = text.trim();
  const isTruncated = trimmed.length > maxLength;
  const display = isTruncated ? `${trimmed.slice(0, maxLength).trimEnd()}…` : trimmed;

  return (
    <span className={cn('block max-w-xs', className)} title={isTruncated ? trimmed : undefined}>
      {display}
    </span>
  );
}
