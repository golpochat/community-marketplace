'use client';

import { cn } from '@community-marketplace/ui';

interface ListingFormStepsProps {
  steps: readonly string[];
  currentStep: number;
  /** When set, steps at or before this index are clickable (e.g. current progress). */
  onStepClick?: (index: number) => void;
  className?: string;
}

export function ListingFormSteps({
  steps,
  currentStep,
  onStepClick,
  className,
}: ListingFormStepsProps) {
  return (
    <div
      className={cn('mb-6 -mx-1 overflow-x-auto px-1', className)}
      role="tablist"
      aria-label="Listing form steps"
    >
      <div className="flex min-w-min gap-2 pb-1">
        {steps.map((label, idx) => {
          const isActive = idx === currentStep;
          const canNavigate = onStepClick && idx <= currentStep;

          if (canNavigate) {
            return (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onStepClick(idx)}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm',
                  isActive
                    ? 'bg-[hsl(var(--dashboard-accent))] text-white'
                    : 'bg-[hsl(var(--dashboard-sidebar-active))] text-[hsl(var(--dashboard-sidebar-muted))] hover:text-[hsl(var(--dashboard-main-fg))]',
                )}
              >
                {label}
              </button>
            );
          }

          return (
            <div
              key={label}
              role="tab"
              aria-selected={isActive}
              className={cn(
                'shrink-0 rounded-lg px-3 py-2 text-center text-xs font-medium sm:px-4 sm:text-sm',
                isActive
                  ? 'bg-[hsl(var(--dashboard-accent))] text-white'
                  : 'bg-[hsl(var(--dashboard-sidebar-active))] text-[hsl(var(--dashboard-sidebar-muted))]',
              )}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
