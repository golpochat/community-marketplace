import { cn } from '@community-marketplace/ui';

const TONE_CLASSES = {
  default: 'border-gray-200 bg-gray-50 text-gray-700',
  primary: 'border-primary/20 bg-primary/10 text-primary',
  accent: 'border-orange-200 bg-orange-50 text-orange-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  sale: 'border-transparent bg-[hsl(var(--brand-secondary))] font-semibold text-white',
  outline: 'border-gray-200 bg-white text-gray-700',
  condition: 'border-sky-200 bg-sky-50 text-sky-800',
  delivery: 'border-slate-200 bg-slate-50 text-slate-700',
  verified: 'border-blue-200 bg-blue-50 text-blue-800',
  trusted: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  gold: 'border-amber-200 bg-amber-50 text-amber-900',
  free: 'border-emerald-300 bg-emerald-600 font-semibold text-white',
  community: 'border-violet-200 bg-violet-50 text-violet-800',
  hybrid: 'border-teal-200 bg-teal-50 text-teal-800',
  fresh: 'border-violet-200 bg-violet-50 text-violet-800',
  boosted: 'border-amber-200 bg-amber-50 text-amber-900',
  featured: 'border-indigo-200 bg-indigo-50 text-indigo-900',
} as const;

export type ListingBadgeTone = keyof typeof TONE_CLASSES;

export interface ListingBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: ListingBadgeTone;
}

export function ListingBadge({ className, tone = 'default', ...props }: ListingBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-medium leading-none',
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}

import { formatListingConditionLabel } from '@community-marketplace/utils';

export function formatListingCondition(condition: string): string {
  return formatListingConditionLabel(condition) ?? condition.replace(/_/g, ' ');
}
