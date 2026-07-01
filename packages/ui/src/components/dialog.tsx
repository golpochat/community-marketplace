'use client';

import * as React from 'react';

import { cn } from '../lib/utils';
import { Button } from './button';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  variant?: 'default' | 'destructive';
  /** When false, the parent closes the dialog after async work completes. */
  closeOnConfirm?: boolean;
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  /** Replaces the default cancel/confirm footer when provided. */
  footer?: React.ReactNode;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
  closeOnConfirm = true,
  confirmLoading = false,
  confirmDisabled = false,
  footer,
}: DialogProps) {
  if (!open) return null;

  const titleId = React.useId();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-200"
        aria-label="Close dialog"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-10 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg',
          'animate-in fade-in zoom-in-95 duration-200',
        )}
      >
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        {children && <div className="mt-4">{children}</div>}
        {footer ?? (
          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={confirmLoading}
            >
              {cancelLabel}
            </Button>
            {onConfirm && (
              <Button
                type="button"
                variant={variant === 'destructive' ? 'destructive' : 'default'}
                disabled={confirmLoading || confirmDisabled}
                onClick={() => {
                  onConfirm();
                  if (closeOnConfirm) onOpenChange(false);
                }}
              >
                {confirmLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
