'use client';

import { useCallback, useEffect, useState } from 'react';

import type {
  BuyerCashbackOverrideEntry,
  BuyerMonetizationSearchResult,
} from '@community-marketplace/types';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

import { monetizationService } from '@/services/monetization.service';
import type { AdminServiceRole } from '@/services/admin.service';

interface AdminMonetizationBuyerCashbackOverridesProps {
  role: AdminServiceRole;
  onMessage: (message: string) => void;
  onError: (error: string) => void;
}

export function AdminMonetizationBuyerCashbackOverrides({
  role,
  onMessage,
  onError,
}: AdminMonetizationBuyerCashbackOverridesProps) {
  const [overrides, setOverrides] = useState<BuyerCashbackOverrideEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BuyerMonetizationSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerMonetizationSearchResult | null>(null);
  const [cashbackPercent, setCashbackPercent] = useState('');

  const loadOverrides = useCallback(async () => {
    setLoading(true);
    try {
      const data = await monetizationService.listBuyerCashbackOverrides(role);
      setOverrides(data);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load cashback overrides');
    } finally {
      setLoading(false);
    }
  }, [role, onError]);

  useEffect(() => {
    void loadOverrides();
  }, [loadOverrides]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const results = await monetizationService.searchBuyersForCashback(role, q);
          setSearchResults(results);
        } catch {
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, role]);

  function selectBuyer(buyer: BuyerMonetizationSearchResult) {
    setSelectedBuyer(buyer);
    setSearchQuery(buyer.displayName ?? buyer.email);
    setSearchResults([]);
    setCashbackPercent(
      buyer.customCashbackPercent != null
        ? String(buyer.customCashbackPercent)
        : String(buyer.effectiveCashbackPercent),
    );
  }

  async function handleSetOverride(clear = false) {
    if (!selectedBuyer) return;
    setSaving(true);
    onError('');
    try {
      await monetizationService.setBuyerCashbackOverride(role, {
        userId: selectedBuyer.id,
        customCashbackPercent: clear ? null : Number(cashbackPercent),
      });
      onMessage(clear ? 'Buyer cashback override cleared.' : 'Buyer cashback override saved.');
      setSelectedBuyer(null);
      setSearchQuery('');
      setCashbackPercent('');
      await loadOverrides();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update buyer cashback');
    } finally {
      setSaving(false);
    }
  }

  async function handleClearOverride(userId: string) {
    setSaving(true);
    onError('');
    try {
      await monetizationService.setBuyerCashbackOverride(role, {
        userId,
        customCashbackPercent: null,
      });
      onMessage('Buyer cashback override cleared.');
      await loadOverrides();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to clear override');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardCard title="Per-buyer cashback override">
      <p className="mb-3 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
        Search for a buyer by name or email, then set a custom cashback rate (0–10%). Clear to
        revert to the platform default.
      </p>

      <div className="relative mb-4">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (selectedBuyer && e.target.value !== (selectedBuyer.displayName ?? selectedBuyer.email)) {
              setSelectedBuyer(null);
            }
          }}
          placeholder="Search buyers by name or email…"
          className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
        />
        {searching && (
          <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">Searching…</p>
        )}
        {searchResults.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-main-bg))] shadow-md">
            {searchResults.map((buyer) => (
              <li key={buyer.id}>
                <button
                  type="button"
                  onClick={() => selectBuyer(buyer)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)]"
                >
                  <span className="font-medium text-[hsl(var(--dashboard-main-fg))]">
                    {buyer.displayName ?? buyer.email}
                  </span>
                  {buyer.displayName && (
                    <span className="ml-2 text-[hsl(var(--dashboard-sidebar-muted))]">
                      {buyer.email}
                    </span>
                  )}
                  <span className="ml-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                    Cashback: {buyer.effectiveCashbackPercent}%
                    {buyer.customCashbackPercent != null ? ' (override)' : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedBuyer && (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] p-4 sm:flex-row sm:items-end">
          <div className="flex-1 text-sm">
            <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">
              {selectedBuyer.displayName ?? selectedBuyer.email}
            </p>
            <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{selectedBuyer.email}</p>
          </div>
          <input
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={cashbackPercent}
            onChange={(e) => setCashbackPercent(e.target.value)}
            placeholder="Cashback %"
            className="w-32 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={saving || !cashbackPercent}
            onClick={() => void handleSetOverride(false)}
            className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Set override
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSetOverride(true)}
            className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-2 text-sm font-medium hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)] disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      )}

      <h3 className="mb-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
        Active overrides
      </h3>
      {loading ? (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
      ) : overrides.length === 0 ? (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No active overrides.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-sidebar-muted))]">
                <th className="py-2 pr-4 font-medium">Buyer</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Override %</th>
                <th className="py-2 pr-4 font-medium">Default %</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {overrides.map((entry) => (
                <tr
                  key={entry.userId}
                  className="border-b border-[hsl(var(--dashboard-sidebar-border)/0.5)]"
                >
                  <td className="py-2 pr-4">{entry.displayName ?? '—'}</td>
                  <td className="py-2 pr-4">{entry.email}</td>
                  <td className="py-2 pr-4 font-medium">{entry.customCashbackPercent}%</td>
                  <td className="py-2 pr-4 text-[hsl(var(--dashboard-sidebar-muted))]">
                    {entry.defaultCashbackPercent}%
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleClearOverride(entry.userId)}
                      className="text-sm text-[hsl(var(--dashboard-accent))] hover:underline disabled:opacity-50"
                    >
                      Clear
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
