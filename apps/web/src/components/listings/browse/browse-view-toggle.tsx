'use client';

import { cn } from '@community-marketplace/ui';
import { LayoutGrid, List } from 'lucide-react';

import {
  type BrowseViewMode,
  useBrowseViewMode,
} from '@/components/listings/browse/browse-view-preferences';

interface BrowseViewToggleProps {
  className?: string;
  mode?: BrowseViewMode;
  onChange?: (mode: BrowseViewMode) => void;
}

export function BrowseViewToggle({ className, mode: controlledMode, onChange }: BrowseViewToggleProps) {
  const [internalMode, setInternalMode] = useBrowseViewMode();
  const mode = controlledMode ?? internalMode;
  const setMode = onChange ?? setInternalMode;

  return (
    <div
      className={cn('inline-flex rounded-lg border border-border bg-card p-0.5', className)}
      role="group"
      aria-label="View mode"
    >
      <ViewButton
        active={mode === 'grid'}
        label="Grid view"
        onClick={() => setMode('grid')}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden />
      </ViewButton>
      <ViewButton
        active={mode === 'list'}
        label="List view"
        onClick={() => setMode('list')}
      >
        <List className="h-4 w-4" aria-hidden />
      </ViewButton>
    </div>
  );
}

function ViewButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors',
        active
          ? 'bg-primary text-primary-foreground shadow-brand-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

export type { BrowseViewMode };
