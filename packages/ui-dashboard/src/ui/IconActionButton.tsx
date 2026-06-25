import Link from 'next/link';

import { cn } from '@community-marketplace/ui';

import { Icon, type DashboardIconName } from './Icon';
import { Tooltip } from './Tooltip';

export interface IconActionButtonProps {
  icon: DashboardIconName;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'accent' | 'danger';
  href?: string;
  type?: 'button' | 'submit';
}

const VARIANT_CLASSES = {
  default:
    'border border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-sidebar-muted))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.5)] hover:text-[hsl(var(--dashboard-main-fg))]',
  accent:
    'border-transparent text-[hsl(var(--dashboard-accent))] hover:bg-[hsl(var(--dashboard-accent)/0.1)]',
  danger: 'border-transparent text-red-600 hover:bg-red-50',
} as const;

export function IconActionButton({
  icon,
  label,
  onClick,
  disabled = false,
  variant = 'default',
  href,
  type = 'button',
}: IconActionButtonProps) {
  const className = cn(
    'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-50',
    VARIANT_CLASSES[variant],
  );

  const content = href ? (
    <Link href={href} className={className} aria-label={label}>
      <Icon name={icon} size={16} />
    </Link>
  ) : (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-label={label}
    >
      <Icon name={icon} size={16} />
    </button>
  );

  return <Tooltip label={label}>{content}</Tooltip>;
}

export function IconActionGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-1', className)}>{children}</div>;
}
