'use client';

import { useEffect, useState } from 'react';

import { formatCountdownRemaining } from '@/lib/format-countdown';

/** Live countdown label that ticks every second until expiry. */
export function useCountdownLabel(expiresAt?: string | null): string | null {
  const [label, setLabel] = useState(() => formatCountdownRemaining(expiresAt));

  useEffect(() => {
    if (!expiresAt) {
      setLabel(null);
      return;
    }
    const tick = () => setLabel(formatCountdownRemaining(expiresAt));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  return label;
}
