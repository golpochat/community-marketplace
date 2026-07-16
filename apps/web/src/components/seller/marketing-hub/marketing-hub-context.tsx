"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { AiMarketingQuotaSummary } from "@community-marketplace/types";

import { aiMarketingService } from "@/services/ai-marketing.service";

interface MarketingHubContextValue {
  quota: AiMarketingQuotaSummary | null;
  loadingQuota: boolean;
  disabled: boolean;
  refreshQuota: () => Promise<void>;
  patchQuota: (patch: Partial<AiMarketingQuotaSummary>) => void;
}

const MarketingHubContext = createContext<MarketingHubContextValue | null>(
  null,
);

export function MarketingHubProvider({ children }: { children: ReactNode }) {
  const [quota, setQuota] = useState<AiMarketingQuotaSummary | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(true);

  const refreshQuota = useCallback(async () => {
    try {
      setQuota(await aiMarketingService.getQuota());
    } catch {
      setQuota(null);
    } finally {
      setLoadingQuota(false);
    }
  }, []);

  useEffect(() => {
    void refreshQuota();
  }, [refreshQuota]);

  const patchQuota = useCallback((patch: Partial<AiMarketingQuotaSummary>) => {
    setQuota((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo<MarketingHubContextValue>(
    () => ({
      quota,
      loadingQuota,
      disabled: quota?.enabled === false,
      refreshQuota,
      patchQuota,
    }),
    [quota, loadingQuota, refreshQuota, patchQuota],
  );

  return (
    <MarketingHubContext.Provider value={value}>
      {children}
    </MarketingHubContext.Provider>
  );
}

export function useMarketingHub() {
  const ctx = useContext(MarketingHubContext);
  if (!ctx) {
    throw new Error("useMarketingHub must be used within MarketingHubProvider");
  }
  return ctx;
}

/** Optional access when a panel may render outside the hub. */
export function useMarketingHubOptional() {
  return useContext(MarketingHubContext);
}
