'use client';

export interface VerificationProgressBarProps {
  used: number;
  limit: number;
  className?: string;
  label?: string;
}

export function VerificationProgressBar({
  used,
  limit,
  className,
  label = 'Unverified live listings used',
}: VerificationProgressBarProps) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const tone =
    used >= limit
      ? 'bg-red-500'
      : used >= limit - 1
        ? 'bg-amber-500'
        : 'bg-[hsl(var(--dashboard-accent))]';

  return (
    <div className={className}>
      <div className="mb-1 flex justify-between text-xs font-medium opacity-80">
        <span>{label}</span>
        <span>
          {used}/{limit}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-black/10"
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
      >
        <div
          className={`h-full rounded-full transition-all ${tone}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
