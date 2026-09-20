'use client';

import { useEffect, useState } from 'react';

import type { SellerPlatformFeeInfo } from '@community-marketplace/types';
import { formatSellerFeeDisclosure } from '@community-marketplace/utils';

import { monetizationService } from '@/services/monetization.service';

export function SellerFeeNotice({ className }: { className?: string }) {
  const [info, setInfo] = useState<SellerPlatformFeeInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    void monetizationService
      .getSellerPlatformFee()
      .then((fee) => {
        if (!cancelled) setInfo(fee);
      })
      .catch(() => {
        if (!cancelled) setInfo(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!info) return null;

  return (
    <p className={className ?? 'mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]'}>
      {formatSellerFeeDisclosure(info)}
    </p>
  );
}
