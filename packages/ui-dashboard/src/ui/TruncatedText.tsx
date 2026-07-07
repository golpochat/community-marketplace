'use client';

import { cn } from '@community-marketplace/ui';

import { Tooltip } from './Tooltip';

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

  const content = (
    <span className={cn('block max-w-xs truncate', className)}>{display}</span>
  );

  if (!isTruncated) {
    return content;
  }

  return (
    <Tooltip label={trimmed} side="top" multiline className="max-w-full">
      {content}
    </Tooltip>
  );
}
