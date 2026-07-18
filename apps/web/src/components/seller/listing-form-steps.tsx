'use client';

import { Check } from 'lucide-react';

import { cn } from '@community-marketplace/ui';

interface ListingFormStepsProps {
  steps: readonly string[];
  currentStep: number;
  /**
   * Highest step index the user has successfully completed (via Next).
   * Use -1 when nothing is completed yet.
   */
  highestCompletedStep?: number;
  /** Navigate to a reachable step (completed or current). */
  onStepClick?: (index: number) => void;
  className?: string;
}

function isReachable(
  index: number,
  currentStep: number,
  highestCompletedStep: number,
): boolean {
  return index <= Math.max(currentStep, highestCompletedStep);
}

export function ListingFormSteps({
  steps,
  currentStep,
  highestCompletedStep = -1,
  onStepClick,
  className,
}: ListingFormStepsProps) {
  const currentLabel = steps[currentStep] ?? '';

  return (
    <nav
      className={cn('mb-6', className)}
      aria-label="Listing form steps"
    >
      <p className="mb-3 text-sm text-[hsl(var(--dashboard-sidebar-muted))] sm:hidden">
        Step {currentStep + 1} of {steps.length}
        {currentLabel ? (
          <>
            {' · '}
            <span className="font-medium text-[hsl(var(--dashboard-main-fg))]">
              {currentLabel}
            </span>
          </>
        ) : null}
      </p>

      <ol className="flex w-full items-start">
        {steps.map((label, idx) => {
          const isCurrent = idx === currentStep;
          const isComplete = idx <= highestCompletedStep && !isCurrent;
          const reachable = isReachable(idx, currentStep, highestCompletedStep);
          const canClick = Boolean(onStepClick) && reachable;

          return (
            <li
              key={label}
              className={cn(
                'relative flex min-w-0 flex-1 flex-col items-center',
                idx < steps.length - 1 &&
                  'after:absolute after:left-[calc(50%+14px)] after:right-[calc(-50%+14px)] after:top-3.5 after:h-0.5 after:content-[""]',
                idx < steps.length - 1 &&
                  (idx < currentStep || idx < highestCompletedStep
                    ? 'after:bg-[hsl(var(--dashboard-accent))]'
                    : 'after:bg-[hsl(var(--dashboard-sidebar-border))]'),
              )}
            >
              <button
                type="button"
                role="tab"
                aria-selected={isCurrent}
                aria-current={isCurrent ? 'step' : undefined}
                disabled={!canClick}
                onClick={() => {
                  if (canClick) onStepClick?.(idx);
                }}
                className={cn(
                  'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                  isCurrent &&
                    'border-[hsl(var(--dashboard-accent))] bg-[hsl(var(--dashboard-accent))] text-white',
                  isComplete &&
                    'border-[hsl(var(--dashboard-accent))] bg-[hsl(var(--dashboard-accent)/0.12)] text-[hsl(var(--dashboard-accent))]',
                  !isCurrent &&
                    !isComplete &&
                    'border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] text-[hsl(var(--dashboard-sidebar-muted))]',
                  canClick && !isCurrent && 'cursor-pointer hover:border-[hsl(var(--dashboard-accent))]',
                  !canClick && 'cursor-default',
                )}
              >
                {isComplete ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  idx + 1
                )}
              </button>
              <span
                className={cn(
                  'mt-2 hidden max-w-[5.5rem] text-center text-[11px] font-medium leading-tight sm:block md:max-w-none md:text-xs',
                  isCurrent
                    ? 'text-[hsl(var(--dashboard-main-fg))]'
                    : 'text-[hsl(var(--dashboard-sidebar-muted))]',
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
