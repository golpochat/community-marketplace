'use client';

import { useEffect, useState } from 'react';

import type {
  BoostPackageType,
  MonetizationProduct,
  MonetizationProductStatus,
  MonetizationProductType,
} from '@community-marketplace/types';
import type { MonetizationProductUpsertInput } from '@community-marketplace/validation';

interface ProductFormState {
  code: string;
  name: string;
  description: string;
  type: MonetizationProductType;
  status: MonetizationProductStatus;
  price: string;
  currency: string;
  durationDays: string;
  durationHours: string;
  placement: string;
  packageType: BoostPackageType | '';
  slotsPerDay: string;
  sortOrder: string;
}

function emptyForm(type: MonetizationProductType = 'listing_boost'): ProductFormState {
  return {
    code: '',
    name: '',
    description: '',
    type,
    status: 'draft',
    price: '',
    currency: 'EUR',
    durationDays: type === 'listing_boost' ? '7' : '',
    durationHours: type === 'featured_slot' ? '24' : '',
    placement: 'homepage',
    packageType: 'PAID_7D',
    slotsPerDay: '',
    sortOrder: '0',
  };
}

function formFromProduct(product: MonetizationProduct): ProductFormState {
  return {
    code: product.code,
    name: product.name,
    description: product.description ?? '',
    type: product.type,
    status: product.status,
    price: String(product.price),
    currency: product.currency,
    durationDays: product.durationDays != null ? String(product.durationDays) : '',
    durationHours: product.durationHours != null ? String(product.durationHours) : '',
    placement: product.placement ?? 'homepage',
    packageType: product.packageType ?? 'PAID_7D',
    slotsPerDay: product.slotsPerDay != null ? String(product.slotsPerDay) : '',
    sortOrder: String(product.sortOrder),
  };
}

function buildCreatePayload(form: ProductFormState): MonetizationProductUpsertInput {
  const payload: MonetizationProductUpsertInput = {
    code: form.code.trim(),
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    type: form.type,
    status: form.status,
    price: Number(form.price),
    currency: form.currency.trim() || 'EUR',
    sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
  };

  if (form.type === 'listing_boost') {
    payload.packageType = form.packageType as BoostPackageType;
    if (form.durationDays) payload.durationDays = Number(form.durationDays);
  } else {
    payload.placement = form.placement.trim();
    if (form.durationHours) payload.durationHours = Number(form.durationHours);
    if (form.durationDays) payload.durationDays = Number(form.durationDays);
    if (form.slotsPerDay) payload.slotsPerDay = Number(form.slotsPerDay);
  }

  return payload;
}

function buildUpdatePayload(
  form: ProductFormState,
): Partial<MonetizationProductUpsertInput> {
  const { code: _code, ...payload } = buildCreatePayload(form);
  return payload;
}

function validateForm(form: ProductFormState, isEdit: boolean): string | null {
  if (!isEdit && !/^[a-z0-9_]{2,64}$/.test(form.code.trim())) {
    return 'Code must be 2–64 lowercase letters, numbers, or underscores.';
  }
  if (!form.name.trim()) return 'Name is required.';
  if (!form.price || Number(form.price) < 0) return 'Price must be zero or greater.';
  if (form.type === 'listing_boost' && !form.packageType) {
    return 'Boost products require a package type.';
  }
  if (form.type === 'featured_slot') {
    if (!form.placement.trim()) return 'Featured products require a placement.';
    if (!form.durationHours && !form.durationDays) {
      return 'Featured products require duration in hours or days.';
    }
  }
  return null;
}

interface AdminMonetizationProductModalProps {
  open: boolean;
  product: MonetizationProduct | null;
  onClose: () => void;
  onSave: (
    payload: MonetizationProductUpsertInput | Partial<MonetizationProductUpsertInput>,
    productId?: string,
  ) => Promise<void>;
}

export function AdminMonetizationProductModal({
  open,
  product,
  onClose,
  onSave,
}: AdminMonetizationProductModalProps) {
  const isEdit = product != null;
  const [form, setForm] = useState<ProductFormState>(() => emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(product ? formFromProduct(product) : emptyForm());
    setError(null);
  }, [open, product]);

  if (!open) return null;

  function updateForm(patch: Partial<ProductFormState>) {
    setForm((current) => {
      const next = { ...current, ...patch };
      if (patch.type === 'listing_boost') {
        next.placement = '';
        next.durationHours = '';
        if (!next.packageType) next.packageType = 'PAID_7D';
        if (!next.durationDays) next.durationDays = '7';
      }
      if (patch.type === 'featured_slot') {
        next.packageType = '';
        next.durationDays = '';
        if (!next.durationHours) next.durationHours = '24';
        if (!next.placement) next.placement = 'homepage';
      }
      if (patch.packageType === 'PAID_7D') next.durationDays = '7';
      if (patch.packageType === 'PAID_30D') next.durationDays = '30';
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationError = validateForm(form, isEdit);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = isEdit ? buildUpdatePayload(form) : buildCreatePayload(form);
      if (isEdit) {
        await onSave(payload, product.id);
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm';
  const labelClass = 'mb-1 block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] shadow-xl">
        <div className="flex items-center justify-between border-b border-[hsl(var(--dashboard-sidebar-border))] px-6 py-4">
          <h3 className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]">
            {isEdit ? 'Edit product' : 'Add product'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md p-1 text-[hsl(var(--dashboard-sidebar-muted))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.5)] hover:text-[hsl(var(--dashboard-main-fg))]"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-4">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <label className="block text-sm">
            <span className={labelClass}>Product type</span>
            <select
              value={form.type}
              onChange={(e) =>
                updateForm({ type: e.target.value as MonetizationProductType })
              }
              disabled={isEdit}
              className={inputClass}
            >
              <option value="listing_boost">Listing boost</option>
              <option value="featured_slot">Featured slot</option>
            </select>
          </label>

          <label className="block text-sm">
            <span className={labelClass}>Code</span>
            <input
              value={form.code}
              onChange={(e) => updateForm({ code: e.target.value.toLowerCase() })}
              disabled={isEdit}
              placeholder="boost_7d"
              className={`${inputClass} font-mono disabled:opacity-60`}
            />
            {isEdit && (
              <span className="mt-1 block text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                Code cannot be changed after creation.
              </span>
            )}
          </label>

          <label className="block text-sm">
            <span className={labelClass}>Name</span>
            <input
              value={form.name}
              onChange={(e) => updateForm({ name: e.target.value })}
              placeholder="7-day boost"
              className={inputClass}
            />
          </label>

          <label className="block text-sm">
            <span className={labelClass}>Description (optional)</span>
            <textarea
              value={form.description}
              onChange={(e) => updateForm({ description: e.target.value })}
              rows={2}
              className={inputClass}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className={labelClass}>Price</span>
              <input
                type="number"
                min={0}
                max={9999}
                step={0.01}
                value={form.price}
                onChange={(e) => updateForm({ price: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className={labelClass}>Currency</span>
              <input
                value={form.currency}
                onChange={(e) => updateForm({ currency: e.target.value.toUpperCase() })}
                maxLength={3}
                className={inputClass}
              />
            </label>
          </div>

          {form.type === 'listing_boost' && (
            <>
              <label className="block text-sm">
                <span className={labelClass}>Package type</span>
                <select
                  value={form.packageType}
                  onChange={(e) =>
                    updateForm({ packageType: e.target.value as BoostPackageType })
                  }
                  className={inputClass}
                >
                  <option value="PAID_7D">PAID_7D (7 days)</option>
                  <option value="PAID_30D">PAID_30D (30 days)</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className={labelClass}>Duration (days)</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.durationDays}
                  onChange={(e) => updateForm({ durationDays: e.target.value })}
                  className={inputClass}
                />
              </label>
            </>
          )}

          {form.type === 'featured_slot' && (
            <>
              <label className="block text-sm">
                <span className={labelClass}>Placement</span>
                <select
                  value={form.placement}
                  onChange={(e) => updateForm({ placement: e.target.value })}
                  className={inputClass}
                >
                  <option value="homepage">Homepage</option>
                  <option value="category">Category</option>
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className={labelClass}>Duration (hours)</span>
                  <input
                    type="number"
                    min={1}
                    max={720}
                    value={form.durationHours}
                    onChange={(e) => updateForm({ durationHours: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm">
                  <span className={labelClass}>Slots per day (optional)</span>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={form.slotsPerDay}
                    onChange={(e) => updateForm({ slotsPerDay: e.target.value })}
                    className={inputClass}
                  />
                </label>
              </div>
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className={labelClass}>Status</span>
              <select
                value={form.status}
                onChange={(e) =>
                  updateForm({ status: e.target.value as MonetizationProductStatus })
                }
                className={inputClass}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className={labelClass}>Sort order</span>
              <input
                type="number"
                min={0}
                max={9999}
                value={form.sortOrder}
                onChange={(e) => updateForm({ sortOrder: e.target.value })}
                className={inputClass}
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-[hsl(var(--dashboard-sidebar-border))] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-2 text-sm font-medium hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
