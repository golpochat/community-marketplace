'use client';

import { useEffect, useState } from 'react';

import { Dialog } from '@community-marketplace/ui';

import {
  LISTING_MODERATION_REASON_OTHER,
  composeModerationReason,
} from '@/lib/listing-moderation-reasons';

export interface ReasonPromptDialogProps {
  open: boolean;
  title: string;
  description?: string;
  label?: string;
  placeholder?: string;
  confirmLabel?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  required?: boolean;
  defaultValue?: string;
  elevated?: boolean;
  /** When set, shows a preset dropdown plus optional detail field. */
  presets?: readonly string[];
  detailLabel?: string;
  detailPlaceholder?: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

/** Branded text prompt — replaces browser `window.prompt`. */
export function ReasonPromptDialog({
  open,
  title,
  description,
  label = 'Reason',
  placeholder = 'Enter details…',
  confirmLabel = 'Confirm',
  variant = 'default',
  loading = false,
  required = true,
  defaultValue = '',
  elevated = false,
  presets,
  detailLabel = 'More detail for the seller',
  detailPlaceholder = 'Optional — add specifics the seller should fix…',
  onConfirm,
  onClose,
}: ReasonPromptDialogProps) {
  const usePresets = Boolean(presets && presets.length > 0);
  const [value, setValue] = useState(defaultValue);
  const [preset, setPreset] = useState('');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    if (!open) return;
    setValue(defaultValue);
    setPreset('');
    setDetail('');
  }, [open, title, defaultValue]);

  const isOther = preset === LISTING_MODERATION_REASON_OTHER;
  const trimmed = value.trim();
  const composed = usePresets ? composeModerationReason(preset, detail) : trimmed;
  const canConfirm = usePresets
    ? preset.length > 0 && (!isOther || detail.trim().length > 0) && (!required || composed.length > 0)
    : !required || trimmed.length > 0;

  return (
    <Dialog
      open={open}
      elevated={elevated}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      variant={variant}
      confirmLoading={loading}
      confirmDisabled={!canConfirm}
      closeOnConfirm={false}
      onConfirm={() => {
        if (!canConfirm) return;
        onConfirm(composed);
      }}
    >
      {usePresets ? (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-foreground">
            {label}
            <span className="text-destructive"> *</span>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="" disabled>
                Select a cause…
              </option>
              {presets!.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-foreground">
            {detailLabel}
            {isOther ? <span className="text-destructive"> *</span> : null}
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              placeholder={
                isOther
                  ? 'Describe the reason for the seller…'
                  : detailPlaceholder
              }
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
        </div>
      ) : (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            placeholder={placeholder}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
      )}
    </Dialog>
  );
}

/** @deprecated Use `ReasonPromptDialog`. */
export const FraudReasonDialog = ReasonPromptDialog;
