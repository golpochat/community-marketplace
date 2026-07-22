'use client';

import { useCallback, useEffect, useState } from 'react';

import type {
  SellerAiFreeUnitsOverrideEntry,
  SellerMonetizationSearchResult,
} from '@community-marketplace/types';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

import { monetizationService } from '@/services/monetization.service';
import type { AdminServiceRole } from '@/services/admin.service';

interface AdminMonetizationAiFreeUnitsOverridesProps {
  role: AdminServiceRole;
  platformFreeUnitsMonthly: number;
  onMessage: (message: string) => void;
  onError: (error: string) => void;
}

export function AdminMonetizationAiFreeUnitsOverrides({
  role,
  platformFreeUnitsMonthly,
  onMessage,
  onError,
}: AdminMonetizationAiFreeUnitsOverridesProps) {
  const [overrides, setOverrides] = useState<SellerAiFreeUnitsOverrideEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SellerMonetizationSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerMonetizationSearchResult | null>(
    null,
  );
  const [units, setUnits] = useState('');

  const loadOverrides = useCallback(async () => {
    setLoading(true);
    try {
      const data = await monetizationService.listSellerAiFreeUnitsOverrides(role);
      setOverrides(data);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load AI free-unit overrides');
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
          const results = await monetizationService.searchSellersForMonetization(role, q);
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

  function selectSeller(seller: SellerMonetizationSearchResult) {
    setSelectedSeller(seller);
    setSearchQuery(seller.displayName ?? seller.email);
    setSearchResults([]);
    setUnits(
      seller.customAiMarketingFreeUnitsMonthly != null
        ? String(seller.customAiMarketingFreeUnitsMonthly)
        : String(seller.effectiveAiFreeUnitsMonthly),
    );
  }

  async function handleSetOverride(clear = false) {
    if (!selectedSeller) return;
    setSaving(true);
    onError('');
    try {
      await monetizationService.setSellerAiFreeUnitsOverride(role, {
        userId: selectedSeller.id,
        customAiMarketingFreeUnitsMonthly: clear ? null : Number(units),
      });
      onMessage(
        clear ? 'Seller AI free-units override cleared.' : 'Seller AI free-units override saved.',
      );
      setSelectedSeller(null);
      setSearchQuery('');
      setUnits('');
      await loadOverrides();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update AI free units');
    } finally {
      setSaving(false);
    }
  }

  async function handleClearOverride(entry: SellerAiFreeUnitsOverrideEntry) {
    setSaving(true);
    onError('');
    try {
      await monetizationService.setSellerAiFreeUnitsOverride(role, {
        userId: entry.userId,
        customAiMarketingFreeUnitsMonthly: null,
      });
      onMessage('Seller AI free-units override cleared.');
      await loadOverrides();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to clear override');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardCard title="Per-seller AI free units">
      <p className="mb-3 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
        Override the monthly free AI allowance for a specific seller. Leave unset to use the
        platform default ({platformFreeUnitsMonthly}/mo for verified sellers; 0 for unverified).
        Setting 0 disables free units for that seller.
      </p>

      <div className="relative mb-4">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (
              selectedSeller &&
              e.target.value !== (selectedSeller.displayName ?? selectedSeller.email)
            ) {
              setSelectedSeller(null);
            }
          }}
          placeholder="Search sellers by name or email…"
          className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
        />
        {searching && (
          <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">Searching…</p>
        )}
        {searchResults.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-main-bg))] shadow-md">
            {searchResults.map((seller) => (
              <li key={seller.id}>
                <button
                  type="button"
                  onClick={() => selectSeller(seller)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)]"
                >
                  <span className="font-medium text-[hsl(var(--dashboard-main-fg))]">
                    {seller.displayName ?? seller.email}
                  </span>
                  {seller.displayName && (
                    <span className="ml-2 text-[hsl(var(--dashboard-sidebar-muted))]">
                      {seller.email}
                    </span>
                  )}
                  <span className="ml-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                    Free units: {seller.effectiveAiFreeUnitsMonthly}/mo
                    {seller.customAiMarketingFreeUnitsMonthly != null ? ' (override)' : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedSeller && (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] p-4 sm:flex-row sm:items-end">
          <div className="flex-1 text-sm">
            <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">
              {selectedSeller.displayName ?? selectedSeller.email}
            </p>
            <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              {selectedSeller.email} · Status: {selectedSeller.sellerStatus} · Effective:{' '}
              {selectedSeller.effectiveAiFreeUnitsMonthly}/mo
            </p>
          </div>
          <input
            type="number"
            min={0}
            max={500}
            step={1}
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            placeholder="Units"
            className="w-32 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={saving || units === ''}
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
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-sidebar-muted))]">
                <th className="py-2 pr-4 font-medium">Seller</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Override</th>
                <th className="py-2 pr-4 font-medium">Platform default</th>
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
                  <td className="py-2 pr-4 font-medium">
                    {entry.customAiMarketingFreeUnitsMonthly}/mo
                  </td>
                  <td className="py-2 pr-4 text-[hsl(var(--dashboard-sidebar-muted))]">
                    {entry.platformFreeUnitsMonthly}/mo
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleClearOverride(entry)}
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
