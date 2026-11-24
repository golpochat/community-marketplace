'use client';

import { useCallback, useEffect, useState } from 'react';

import type { StripeConnectAccount } from '@community-marketplace/types';

import { paymentsService } from '@/services/payments.service';

export function useSellerConnectStatus(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [connect, setConnect] = useState<StripeConnectAccount | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setConnect(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const account = await paymentsService.getConnectStatus();
      setConnect(account);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Stripe Connect status');
      setConnect(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Matches listing `cardCheckoutReady` / assertSellerCanReceivePayments. */
  const isCardCheckoutReady = Boolean(
    connect?.onboardingComplete && connect.chargesEnabled,
  );
  /** Full Express readiness including payouts to bank. */
  const isFullyReady = Boolean(isCardCheckoutReady && connect?.payoutsEnabled);
  /** @deprecated Prefer isCardCheckoutReady for Buy now gates; alias kept for callers. */
  const isReady = isCardCheckoutReady;

  return {
    connect,
    loading,
    error,
    isReady,
    isCardCheckoutReady,
    isFullyReady,
    reload: load,
  };
}
