'use client';

import { useCallback, useEffect, useState } from 'react';

import type { StripeConnectAccount } from '@community-marketplace/types';

import { paymentsService } from '@/services/payments.service';

export function useSellerConnectStatus() {
  const [connect, setConnect] = useState<StripeConnectAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isReady = Boolean(
    connect?.onboardingComplete && connect.chargesEnabled && connect.payoutsEnabled,
  );

  return { connect, loading, error, isReady, reload: load };
}
