'use client';

import { IRISH_MOBILE_PREFIX_TOOLTIP } from '@community-marketplace/validation';

import { InfoTooltip } from '@/components/forms/info-tooltip';

interface IrishMobilePrefixTooltipProps {
  className?: string;
}

export function IrishMobilePrefixTooltip({ className }: IrishMobilePrefixTooltipProps) {
  return (
    <InfoTooltip ariaLabel="Accepted Irish mobile prefixes" className={className}>
      {IRISH_MOBILE_PREFIX_TOOLTIP}
    </InfoTooltip>
  );
}
