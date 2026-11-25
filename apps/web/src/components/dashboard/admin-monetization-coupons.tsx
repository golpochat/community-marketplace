'use client';

import { useCallback, useEffect, useState } from 'react';

import type { CouponDiscountType, PlatformCoupon, PlatformPurchaseType } from '@community-marketplace/types';
import { PLATFORM_PURCHASE_TYPES } from '@community-marketplace/types';
import { useAppFeedback } from '@community-marketplace/ui';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

import { monetizationService } from '@/services/monetization.service';
import type { AdminServiceRole } from '@/services/admin.service';

interface AdminMonetizationCouponsProps {
  role: AdminServiceRole;
}

const SKU_LABELS: Record<PlatformPurchaseType, string> = {
  listing_boost: 'Listing boost',
  featured_slot: 'Featured listing',
  featured_store: 'Featured store',
  fast_track_verification: 'Fast-track verify',
  store_slot_2: 'Store slot 2',
  store_slot_3: 'Store slot 3',
  store_bundle_3: 'Store bundle',
  buyer_statement: 'Buyer statement',
  seller_growth_pack: 'Growth pack',
  ai_credit_2: 'AI credit €2',
  ai_credit_5: 'AI credit €5',
  ai_credit_10: 'AI credit €10',
  early_cashback_unlock: 'Early cashback unlock',
  priority_message: 'Priority message',
};

export function AdminMonetizationCoupons({ role }: AdminMonetizationCouponsProps) {
  const { success: feedbackSuccess, error: feedbackError } = useAppFeedback();
  const [coupons, setCoupons] = useState<PlatformCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<CouponDiscountType>('percent');
  const [discountValue, setDiscountValue] = useState('20');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [maxPerUser, setMaxPerUser] = useState('1');
  const [allowedTypes, setAllowedTypes] = useState<PlatformPurchaseType[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await monetizationService.listCoupons(role);
      setCoupons(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleType(type: PlatformPurchaseType) {
    setAllowedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await monetizationService.createCoupon(role, {
        code,
        discountType,
        discountValue: Number(discountValue),
        allowedPurchaseTypes: allowedTypes,
        maxRedemptions: maxRedemptions.trim() ? Number(maxRedemptions) : null,
        maxPerUser: Number(maxPerUser) || 1,
      });
      setCode('');
      setDiscountValue('20');
      setMaxRedemptions('');
      setMaxPerUser('1');
      setAllowedTypes([]);
      feedbackSuccess('Coupon created', `${code.toUpperCase()} is ready for SKU checkouts.`);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create coupon';
      setError(message);
      feedbackError('Could not create coupon', message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(couponId: string, couponCode: string) {
    setSaving(true);
    try {
      await monetizationService.deactivateCoupon(role, couponId);
      feedbackSuccess('Coupon deactivated', `${couponCode} can no longer be redeemed.`);
      await load();
    } catch (err) {
      feedbackError(
        'Could not deactivate',
        err instanceof Error ? err.message : 'Failed to deactivate coupon',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <DashboardCard title="Create coupon">
        <p className="mb-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          Codes discount paid products (boosts, featured, AI packs, etc.). They never change the
          seller service fee on card checkout.
        </p>
        <form className="space-y-4" onSubmit={(e) => void handleCreate(e)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Code
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-transparent px-3 py-2 text-sm uppercase"
                placeholder="PILOT20"
              />
            </label>
            <label className="block text-sm font-medium">
              Discount type
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as CouponDiscountType)}
                className="mt-1 w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-transparent px-3 py-2 text-sm"
              >
                <option value="percent">Percent</option>
                <option value="fixed">Fixed EUR</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Value {discountType === 'percent' ? '(%)' : '(€)'}
              <input
                required
                type="number"
                min={0.01}
                step={0.01}
                max={discountType === 'percent' ? 100 : 10000}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-transparent px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm font-medium">
              Max per user
              <input
                type="number"
                min={1}
                max={100}
                value={maxPerUser}
                onChange={(e) => setMaxPerUser(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-transparent px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm font-medium sm:col-span-2">
              Global max redemptions (blank = unlimited)
              <input
                type="number"
                min={1}
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-transparent px-3 py-2 text-sm"
                placeholder="Unlimited"
              />
            </label>
          </div>
          <fieldset>
            <legend className="text-sm font-medium">Allowed SKUs (none selected = all)</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {PLATFORM_PURCHASE_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={allowedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                  />
                  {SKU_LABELS[type]}
                </label>
              ))}
            </div>
          </fieldset>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Create coupon'}
          </button>
        </form>
      </DashboardCard>

      <DashboardCard title="Coupons">
        {loading ? (
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No coupons yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-sidebar-muted))]">
                  <th className="py-2 pr-3 font-medium">Code</th>
                  <th className="py-2 pr-3 font-medium">Discount</th>
                  <th className="py-2 pr-3 font-medium">SKUs</th>
                  <th className="py-2 pr-3 font-medium">Used</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="border-b border-[hsl(var(--dashboard-sidebar-border))]/60"
                  >
                    <td className="py-2 pr-3 font-medium">{coupon.code}</td>
                    <td className="py-2 pr-3">
                      {coupon.discountType === 'percent'
                        ? `${coupon.discountValue}%`
                        : `€${coupon.discountValue.toFixed(2)}`}
                    </td>
                    <td className="py-2 pr-3">
                      {coupon.allowedPurchaseTypes.length === 0
                        ? 'All SKUs'
                        : coupon.allowedPurchaseTypes.map((t) => SKU_LABELS[t]).join(', ')}
                    </td>
                    <td className="py-2 pr-3">
                      {coupon.redemptionCount}
                      {coupon.maxRedemptions != null ? ` / ${coupon.maxRedemptions}` : ''}
                    </td>
                    <td className="py-2 pr-3">{coupon.active ? 'Active' : 'Inactive'}</td>
                    <td className="py-2">
                      {coupon.active ? (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void handleDeactivate(coupon.id, coupon.code)}
                          className="text-sm text-destructive underline-offset-2 hover:underline"
                        >
                          Deactivate
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
