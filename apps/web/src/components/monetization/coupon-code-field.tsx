'use client';

interface CouponCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}

/** Optional SKU coupon — never applies to card commission. */
export function CouponCodeField({
  value,
  onChange,
  disabled = false,
  id = 'coupon-code',
}: CouponCodeFieldProps) {
  return (
    <label className="block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]" htmlFor={id}>
      Coupon code <span className="font-normal text-[hsl(var(--dashboard-sidebar-muted))]">(optional)</span>
      <input
        id={id}
        type="text"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder="e.g. PILOT20"
        className="mt-1.5 w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-main-bg))] px-3 py-2 text-sm uppercase tracking-wide text-[hsl(var(--dashboard-main-fg))] disabled:opacity-60"
      />
      <span className="mt-1 block text-xs font-normal text-[hsl(var(--dashboard-sidebar-muted))]">
        Applies to this paid product only — not the seller service fee on card sales.
      </span>
    </label>
  );
}

export function couponCodePayload(code: string): { couponCode: string } | Record<string, never> {
  const trimmed = code.trim();
  return trimmed.length >= 3 ? { couponCode: trimmed } : {};
}
