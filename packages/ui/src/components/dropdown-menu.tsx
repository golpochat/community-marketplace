'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../lib/utils';

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'end';
  className?: string;
  menuClassName?: string;
}

export function DropdownMenu({
  trigger,
  children,
  align = 'end',
  className,
  menuClassName,
}: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <div onClick={() => setOpen((prev) => !prev)}>{trigger}</div>
      {open ? (
        <div
          role="menu"
          className={cn(
            'absolute top-full z-50 mt-2 min-w-[12rem] overflow-hidden rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg',
            'animate-in fade-in zoom-in-95 duration-150',
            align === 'end' ? 'right-0' : 'left-0',
            menuClassName,
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
  destructive?: boolean;
}

export const DropdownMenuItem = React.forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ className, inset, destructive, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors duration-150',
        destructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground hover:bg-muted hover:text-primary',
        inset && 'pl-8',
        className,
      )}
      {...props}
    />
  ),
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

export function DropdownMenuLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-b border-border px-2.5 py-2 text-sm font-medium text-foreground', className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('my-1 h-px bg-border', className)} {...props} />;
}

/** Portal-based dropdown for fixed headers — same API, renders menu in document.body. */
export function DropdownMenuPortal({
  trigger,
  children,
  align = 'end',
  className,
  menuClassName,
}: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 8,
      left: align === 'end' ? rect.right : rect.left,
      width: rect.width,
    });
  }, [open, align]);

  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={triggerRef} className={cn('relative inline-flex', className)}>
      <div onClick={() => setOpen((prev) => !prev)}>{trigger}</div>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{
                position: 'fixed',
                top: coords.top,
                left: align === 'end' ? coords.left : coords.left,
                transform: align === 'end' ? 'translateX(-100%)' : undefined,
                minWidth: Math.max(coords.width, 224),
              }}
              className={cn(
                'z-50 overflow-hidden rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg',
                'animate-in fade-in zoom-in-95 duration-150',
                menuClassName,
              )}
              onClick={() => setOpen(false)}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
