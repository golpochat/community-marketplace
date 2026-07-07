'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@community-marketplace/ui';

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
  side?: TooltipSide;
  disabled?: boolean;
  /** Allow wrapped tooltips for longer copy (e.g. permission messages). */
  multiline?: boolean;
}

const SIDE_OFFSET = 8;

function getCoords(rect: DOMRect, side: TooltipSide) {
  switch (side) {
    case 'right':
      return {
        top: rect.top + rect.height / 2,
        left: rect.right + SIDE_OFFSET,
        transform: 'translateY(-50%)',
      };
    case 'left':
      return {
        top: rect.top + rect.height / 2,
        left: rect.left - SIDE_OFFSET,
        transform: 'translate(-100%, -50%)',
      };
    case 'bottom':
      return {
        top: rect.bottom + SIDE_OFFSET,
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
      };
    case 'top':
    default:
      return {
        top: rect.top - SIDE_OFFSET,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, -100%)',
      };
  }
}

export function Tooltip({
  label,
  children,
  className,
  side = 'top',
  disabled = false,
  multiline = false,
}: TooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    transform: string;
  } | null>(null);

  const hide = useCallback(() => {
    setCoords(null);
  }, []);

  const show = useCallback(() => {
    if (disabled || !triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    setCoords(getCoords(rect, side));
  }, [disabled, side]);

  useEffect(() => {
    if (!coords) {
      return;
    }

    function handleScroll() {
      hide();
    }

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [coords, hide]);

  const tooltip =
    coords && typeof document !== 'undefined'
      ? createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              transform: coords.transform,
            }}
            className={cn(
              'pointer-events-none z-[9999] rounded-md bg-[hsl(var(--dashboard-main-fg))] px-2 py-1 text-xs leading-snug text-[hsl(var(--dashboard-topbar-bg))] shadow-md',
              multiline ? 'max-w-xs whitespace-normal' : 'whitespace-nowrap',
            )}
          >
            {label}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        className={cn('inline-flex', className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {tooltip}
    </>
  );
}
