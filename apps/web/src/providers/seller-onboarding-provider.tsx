'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { AccountSellingPhase, SellerOnboardingSnapshot } from '@community-marketplace/types';
import { deriveAccountSellingPhase } from '@community-marketplace/types';

import { useAuth } from '@/hooks/use-auth';
import { sellerOnboardingService } from '@/services/seller-onboarding.service';

interface SellerOnboardingContextValue {
  snapshot: SellerOnboardingSnapshot | null;
  phase: AccountSellingPhase;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const SellerOnboardingContext = createContext<SellerOnboardingContextValue | null>(null);

export function SellerOnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<SellerOnboardingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      setSnapshot(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await sellerOnboardingService.getStatus();
      setSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load selling status');
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const phase = useMemo((): AccountSellingPhase => {
    return deriveAccountSellingPhase(snapshot);
  }, [snapshot]);

  const value = useMemo(
    () => ({ snapshot, phase, loading, error, refresh }),
    [snapshot, phase, loading, error, refresh],
  );

  return (
    <SellerOnboardingContext.Provider value={value}>{children}</SellerOnboardingContext.Provider>
  );
}

export function useSellerOnboarding(): SellerOnboardingContextValue {
  const context = useContext(SellerOnboardingContext);
  if (!context) {
    throw new Error('useSellerOnboarding must be used within SellerOnboardingProvider');
  }
  return context;
}
