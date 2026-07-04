import type { DisplayAdSlot } from '@community-marketplace/types';

interface DisplayAdSlotProps {
  slot: DisplayAdSlot;
}

export function DisplayAdSlot({ slot }: DisplayAdSlotProps) {
  if (slot.preview) {
    return (
      <aside
        aria-label={`${slot.label} preview`}
        className="mx-auto flex max-w-full items-center justify-center rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)] text-center"
        style={{ width: slot.width, height: slot.height, maxWidth: '100%' }}
      >
        <div className="px-3">
          <p className="text-xs font-medium text-[hsl(var(--foreground))]">{slot.label}</p>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
            Display ad preview · {slot.width}×{slot.height}
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label={slot.label}
      className="mx-auto flex max-w-full items-center justify-center rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)]"
      style={{ width: slot.width, height: slot.height, maxWidth: '100%' }}
      data-ad-placement={slot.placement}
    >
      <div className="px-3 text-center">
        <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{slot.label}</p>
        <p className="text-[11px] text-[hsl(var(--muted-foreground)/0.8)]">
          Sponsored · {slot.width}×{slot.height}
        </p>
      </div>
    </aside>
  );
}

interface DisplayAdPlacementsProps {
  slots: DisplayAdSlot[];
  className?: string;
}

export function DisplayAdPlacements({ slots, className }: DisplayAdPlacementsProps) {
  if (slots.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {slots.map((slot) => (
        <DisplayAdSlot key={slot.placement} slot={slot} />
      ))}
    </div>
  );
}
