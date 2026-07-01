import type { ReactNode } from 'react';

import { Label } from '@community-marketplace/ui';

import { IrishMobilePrefixTooltip } from '@/components/forms/irish-mobile-prefix-tooltip';

interface IrishMobileFieldLabelProps {
  htmlFor: string;
  children?: ReactNode;
  className?: string;
}

export function IrishMobileFieldLabel({
  htmlFor,
  children = 'Irish mobile number',
  className,
}: IrishMobileFieldLabelProps) {
  return (
    <div className={className ?? 'flex items-center gap-1.5'}>
      <Label htmlFor={htmlFor}>{children}</Label>
      <IrishMobilePrefixTooltip />
    </div>
  );
}
