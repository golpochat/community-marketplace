'use client';

import { useCallback, useEffect, useState } from 'react';

import type { BuyerWalletSummary } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { monetizationService } from '@/services/monetization.service';

export default function BuyerWalletPage() {
  const [wallet, setWallet] = useState<BuyerWalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await monetizationService.getBuyerWallet();
      setWallet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="SellNearby Credit"
        description="Earn cashback when you pay by card. Credits unlock after the cooling period."
      />
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      {loading && (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading wallet…</p>
      )}
      {wallet && (
        <div className="space-y-6">
          <DashboardCard title="Available balance">
            <p className="text-3xl font-bold text-[hsl(var(--dashboard-main-fg))]">
              {formatCurrency(wallet.balance, 'EUR')}
            </p>
            <p className="mt-3 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
              SellNearby Credit is building up in your wallet. Spending credits at checkout is
              coming soon.
            </p>
          </DashboardCard>

          <DashboardCard title="Pending unlocks">
            {wallet.pendingUnlocks.length === 0 ? (
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No pending cashback.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {wallet.pendingUnlocks.map((item) => (
                  <li
                    key={item.grantId}
                    className="flex justify-between rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2"
                  >
                    <span>{formatCurrency(item.amount, 'EUR')}</span>
                    <span className="text-[hsl(var(--dashboard-sidebar-muted))]">
                      Unlocks {new Date(item.unlockAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>

          <DashboardCard title="Recent activity">
            {wallet.recentTransactions.length === 0 ? (
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No credit activity yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {wallet.recentTransactions.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex justify-between rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2"
                  >
                    <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                    <span>
                      {tx.type === 'expired' ? '−' : '+'}
                      {formatCurrency(tx.amount, 'EUR')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>

          <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Pay by card on purchases to earn {wallet.cashbackPercent}% SellNearby Credit. Credits
            unlock after {wallet.coolingDays} days if the purchase is not refunded. Credits expire
            after 6 months.
          </p>
        </div>
      )}
    </>
  );
}
