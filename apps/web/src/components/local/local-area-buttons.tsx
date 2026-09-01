'use client';

import { useRef, type PointerEvent as ReactPointerEvent } from 'react';

import type { NearbyArea } from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';
import { DEFAULT_NEARBY_RADIUS_KM } from '@community-marketplace/utils';

import type { LocalFilterMode } from '@/hooks/use-user-location';

const DRAG_THRESHOLD_PX = 6;

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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    scrollLeft: number;
    moved: boolean;
  } | null>(null);

  const chipClass = (active: boolean) =>
    cn(
      'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
      active ? 'bg-primary text-white' : 'bg-muted text-foreground hover:bg-muted',
      loading && 'opacity-60',
    );

  const handleFilterClick = (filter: LocalFilterMode) => {
    if (dragRef.current?.moved) return;
    onFilterChange(filter);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: scroller.scrollLeft,
      moved: false,
    };
    scroller.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const scroller = scrollerRef.current;
    if (!drag || !scroller || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(deltaX) < DRAG_THRESHOLD_PX) return;

    drag.moved = true;
    scroller.scrollLeft = drag.scrollLeft - deltaX;
    scroller.dataset.dragging = 'true';
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const scroller = scrollerRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (scroller?.hasPointerCapture(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }
    delete scroller?.dataset.dragging;

    // Keep moved=true briefly so the chip click that follows a drag is ignored.
    if (drag.moved) {
      window.setTimeout(() => {
        if (dragRef.current === drag) dragRef.current = null;
      }, 0);
      return;
    }

    dragRef.current = null;
  };

  return (
    <div
      ref={scrollerRef}
      className={cn(
        'flex cursor-grab gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        'select-none touch-pan-x data-[dragging=true]:cursor-grabbing data-[dragging=true]:[&_button]:pointer-events-none',
        className,
      )}
      role="toolbar"
      aria-label="Local area filters"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <button
        type="button"
        disabled={loading}
        onClick={() => handleFilterClick('all')}
        className={chipClass(activeFilter === 'all')}
      >
        All nearby (within {radiusKm} km)
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={() => handleFilterClick('free')}
        className={chipClass(activeFilter === 'free')}
      >
        Free-priced items
      </button>

      {areas.map((area) => (
        <button
          key={area.slug}
          type="button"
          disabled={loading}
          onClick={() => handleFilterClick({ area: area.name })}
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
