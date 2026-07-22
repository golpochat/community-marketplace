'use client';

import { useCallback, useEffect, useState } from 'react';

import type {
  BuyerWalletSummary,
  EarlyCashbackUnlockIntentResponse,
} from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { BoostCheckoutPanel } from '@/components/payments/boost-checkout-panel';
import { monetizationService } from '@/services/monetization.service';

export default function BuyerWalletPage() {
  const [wallet, setWallet] = useState<BuyerWalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlockGrantId, setUnlockGrantId] = useState<string | null>(null);
  const [useCredits, setUseCredits] = useState(false);
  const [intent, setIntent] = useState<EarlyCashbackUnlockIntentResponse | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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

  async function startEarlyUnlock(grantId: string) {
    if (!wallet?.earlyUnlock?.enabled) return;
    setCheckoutLoading(true);
    setError(null);
    try {
      const price = wallet.earlyUnlock.price;
      const creditsAmount =
        useCredits && wallet.balance > 0 ? Math.min(wallet.balance, price) : undefined;
      const response = await monetizationService.createEarlyCashbackUnlockIntent({
        grantId,
        ...(creditsAmount && creditsAmount > 0 ? { creditsAmount } : {}),
      });
      setUnlockGrantId(grantId);
      setIntent(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start early unlock');
      setIntent(null);
      setUnlockGrantId(null);
    } finally {
      setCheckoutLoading(false);
    }
  }

  function resetCheckout() {
    setIntent(null);
    setUnlockGrantId(null);
    setUseCredits(false);
  }

  async function handleUnlockSuccess() {
    resetCheckout();
    await load();
  }

  const earlyUnlock = wallet?.earlyUnlock;
  const showEarlyUnlock = Boolean(earlyUnlock?.enabled);

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
              Use credits on listing boosts, fast-track verification, and early cashback unlock.
              Card covers any remainder when your balance is lower than the price.
            </p>
          </DashboardCard>

          <DashboardCard title="Pending unlocks">
            {wallet.pendingUnlocks.length === 0 ? (
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                No pending cashback.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {wallet.pendingUnlocks.map((item) => {
                  const isActive = unlockGrantId === item.grantId;
                  const unlockDate = new Date(item.unlockAt);
                  const alreadyDue = unlockDate.getTime() <= Date.now();

                  return (
                    <li
                      key={item.grantId}
                      className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">
                          {formatCurrency(item.amount, 'EUR')}
                        </span>
                        <span className="text-[hsl(var(--dashboard-sidebar-muted))]">
                          Unlocks {unlockDate.toLocaleDateString()}
                        </span>
                      </div>

                      {showEarlyUnlock && !alreadyDue && !intent && (
                        <div className="mt-3 space-y-2">
                          {wallet.balance > 0 && (
                            <label className="flex cursor-pointer items-start gap-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                              <input
                                type="checkbox"
                                className="mt-0.5"
                                checked={useCredits}
                                onChange={(e) => setUseCredits(e.target.checked)}
                              />
                              <span>
                                Use SellNearby Credit (
                                {formatCurrency(wallet.balance, 'EUR')} available)
                              </span>
                            </label>
                          )}
                          <button
                            type="button"
                            disabled={checkoutLoading}
                            onClick={() => void startEarlyUnlock(item.grantId)}
                            className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                          >
                            Unlock early for {formatCurrency(earlyUnlock!.price, 'EUR')}
                          </button>
                        </div>
                      )}

                      {isActive && intent && (
                        <div className="mt-3 space-y-2">
                          <BoostCheckoutPanel
                            intent={intent}
                            confirmPurchase={monetizationService.confirmEarlyCashbackUnlock}
                            confirmLabel="Pay and unlock"
                            onSuccess={() => void handleUnlockSuccess()}
                          />
                          <button
                            type="button"
                            onClick={resetCheckout}
                            className="text-xs text-[hsl(var(--dashboard-sidebar-muted))] underline"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </DashboardCard>

          <DashboardCard title="Recent activity">
            {wallet.recentTransactions.length === 0 ? (
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                No credit activity yet.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {wallet.recentTransactions.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex justify-between rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2"
                  >
                    <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                    <span>
                      {tx.type === 'expired' ||
                      tx.type === 'ai_generation' ||
                      tx.type === 'spent'
                        ? '−'
                        : '+'}
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
            {showEarlyUnlock
              ? ` Unlock pending credit early for ${formatCurrency(earlyUnlock!.price, 'EUR')}.`
              : ''}
          </p>
        </div>
      )}
    </>
  );
}
