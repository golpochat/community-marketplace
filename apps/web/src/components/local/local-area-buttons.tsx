'use client';

import type { NearbyArea } from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';
import { DEFAULT_NEARBY_RADIUS_KM } from '@community-marketplace/utils';

import type { LocalFilterMode } from '@/hooks/use-user-location';

interface LocalAreaButtonsProps {
  areas: NearbyArea[];
  activeFilter: LocalFilterMode;
  radiusKm?: number;
  loading?: boolean;
  onFilterChange: (filter: LocalFilterMode) => void;
  className?: string;
}

function isAreaActive(activeFilter: LocalFilterMode, areaName: string): boolean {
  return typeof activeFilter === 'object' && activeFilter.area === areaName;
}

export function LocalAreaButtons({
  areas,
  activeFilter,
  radiusKm = DEFAULT_NEARBY_RADIUS_KM,
  loading = false,
  onFilterChange,
  className,
}: LocalAreaButtonsProps) {
  const chipClass = (active: boolean) =>
    cn(
      'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
      active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      loading && 'opacity-60',
    );

  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      role="toolbar"
      aria-label="Local area filters"
    >
      <button
        type="button"
        disabled={loading}
        onClick={() => onFilterChange('all')}
        className={chipClass(activeFilter === 'all')}
      >
        All nearby (within {radiusKm} km)
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={() => onFilterChange('free')}
        className={chipClass(activeFilter === 'free')}
      >
        Free items
      </button>

      {areas.map((area) => (
        <button
          key={area.slug}
          type="button"
          disabled={loading}
          onClick={() => onFilterChange({ area: area.name })}
          className={chipClass(isAreaActive(activeFilter, area.name))}
        >
          {area.name}
          {area.listingCount > 0 ? ` (${area.listingCount})` : ''}
        </button>
      ))}
    </div>
  );
}

export function parseLocalFilterFromParams(
  searchParams: URLSearchParams,
): LocalFilterMode {
  if (searchParams.get('freeOnly') === 'true') return 'free';
  const area = searchParams.get('area');
  if (area) return { area };
  return 'all';
}

export function serializeLocalFilterToParams(
  params: URLSearchParams,
  filter: LocalFilterMode,
): URLSearchParams {
  params.delete('freeOnly');
  params.delete('area');

  if (filter === 'free') {
    params.set('freeOnly', 'true');
  } else if (filter !== 'all') {
    params.set('area', filter.area);
  }

  return params;
}
