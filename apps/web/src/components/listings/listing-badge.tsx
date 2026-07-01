import { cn } from '@community-marketplace/ui';

const TONE_CLASSES = {
  default: 'border-border bg-muted text-foreground',
  primary: 'border-primary/20 bg-primary/10 text-primary',
  accent: 'border-[hsl(var(--brand-accent)/0.35)] bg-[hsl(var(--brand-accent)/0.12)] text-[hsl(var(--brand-accent))]',
  success: 'border-primary/20 bg-primary/10 text-primary',
  sale: 'border-[hsl(var(--brand-accent)/0.35)] bg-[hsl(var(--brand-accent)/0.12)] font-semibold text-[hsl(var(--brand-accent))]',
  outline: 'border-border bg-card text-foreground',
  condition: 'border-border bg-muted text-muted-foreground',
  delivery: 'border-border bg-muted/50 text-muted-foreground',
  verified: 'border-primary/20 bg-primary/10 text-primary',
  trusted: 'border-primary/20 bg-primary/10 text-primary',
  gold: 'border-[hsl(var(--brand-accent)/0.35)] bg-[hsl(var(--brand-accent)/0.12)] text-[hsl(var(--brand-accent))]',
  free: 'border-primary/30 bg-primary font-semibold text-primary-foreground',
  community: 'border-primary/20 bg-primary/10 text-primary',
  hybrid: 'border-primary/20 bg-primary/10 text-primary',
  fresh: 'border-primary/20 bg-primary/10 text-primary',
  boosted: 'border-primary/20 bg-primary/10 text-primary',
  featured: 'border-primary/20 bg-primary/10 text-primary',
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
