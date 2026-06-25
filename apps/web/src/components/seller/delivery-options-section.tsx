'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { DeliveryOption, ListingDeliverySelection } from '@community-marketplace/types';
import { Button, Input, Label } from '@community-marketplace/ui';
import { cn } from '@community-marketplace/ui';

export interface CustomDeliveryField {
  id: string;
  label: string;
  price: string;
}

export interface DeliveryFormState {
  selectedOptionIds: string[];
  customFields: CustomDeliveryField[];
}

interface DeliveryOptionsSectionProps {
  catalog: DeliveryOption[];
  value: DeliveryFormState;
  onChange: (value: DeliveryFormState) => void;
  disabled?: boolean;
}

function emptyCustomField(): CustomDeliveryField {
  return { id: crypto.randomUUID(), label: '', price: '' };
}

export function deliveryStateFromSelections(
  catalog: DeliveryOption[],
  selections: ListingDeliverySelection[],
): DeliveryFormState {
  const customOption = catalog.find((o) => o.zone === 'CUSTOM');
  const selectedOptionIds = [...new Set(selections.map((s) => s.deliveryOptionId))];
  const customFields = selections
    .filter((s) => s.zone === 'CUSTOM' || (customOption && s.deliveryOptionId === customOption.id))
    .map((s) => ({
      id: s.id ?? crypto.randomUUID(),
      label: s.customLabel ?? s.label ?? '',
      price: String(s.customPrice ?? s.price ?? ''),
    }));

  return {
    selectedOptionIds,
    customFields: customFields.length > 0 ? customFields : [],
  };
}

export function selectionsFromDeliveryState(
  catalog: DeliveryOption[],
  state: DeliveryFormState,
): ListingDeliverySelection[] {
  const collection = catalog.find((o) => o.zone === 'COLLECTION');
  const customOption = catalog.find((o) => o.zone === 'CUSTOM');

  if (collection && state.selectedOptionIds.includes(collection.id)) {
    return [
      {
        deliveryOptionId: collection.id,
        label: collection.label,
        zone: 'COLLECTION',
        price: collection.defaultPrice ?? 0,
      },
    ];
  }

  const selections: ListingDeliverySelection[] = [];

  for (const optionId of state.selectedOptionIds) {
    const option = catalog.find((o) => o.id === optionId);
    if (!option || option.zone === 'CUSTOM') continue;
    selections.push({
      deliveryOptionId: option.id,
      label: option.label,
      zone: option.zone,
      price: option.defaultPrice,
    });
  }

  if (customOption && state.selectedOptionIds.includes(customOption.id)) {
    for (const field of state.customFields) {
      if (!field.label.trim()) continue;
      selections.push({
        deliveryOptionId: customOption.id,
        customLabel: field.label.trim(),
        customPrice: Number(field.price) || 0,
        label: field.label.trim(),
        zone: 'CUSTOM',
        price: Number(field.price) || 0,
      });
    }
  }

  return selections;
}

export function DeliveryOptionsSection({
  catalog,
  value,
  onChange,
  disabled = false,
}: DeliveryOptionsSectionProps) {
  const collectionOption = catalog.find((o) => o.zone === 'COLLECTION');
  const customOption = catalog.find((o) => o.zone === 'CUSTOM');
  const predefinedOptions = catalog.filter(
    (o) => o.zone !== 'COLLECTION' && o.zone !== 'CUSTOM',
  );

  const collectionSelected =
    collectionOption != null && value.selectedOptionIds.includes(collectionOption.id);
  const customSelected =
    customOption != null && value.selectedOptionIds.includes(customOption.id);

  const toggleOption = useCallback(
    (optionId: string, zone: DeliveryOption['zone']) => {
      if (disabled) return;

      if (zone === 'COLLECTION') {
        const isOn = value.selectedOptionIds.includes(optionId);
        onChange({
          selectedOptionIds: isOn ? [] : [optionId],
          customFields: [],
        });
        return;
      }

      let nextIds = value.selectedOptionIds.filter(
        (id) => collectionOption == null || id !== collectionOption.id,
      );

      if (nextIds.includes(optionId)) {
        nextIds = nextIds.filter((id) => id !== optionId);
      } else {
        nextIds = [...nextIds, optionId];
      }

      let customFields = value.customFields;
      if (zone === 'CUSTOM' && !nextIds.includes(optionId)) {
        customFields = [];
      }
      if (zone === 'CUSTOM' && nextIds.includes(optionId) && customFields.length === 0) {
        customFields = [emptyCustomField()];
      }

      onChange({ selectedOptionIds: nextIds, customFields });
    },
    [collectionOption, disabled, onChange, value.customFields, value.selectedOptionIds],
  );

  useEffect(() => {
    if (customSelected && value.customFields.length === 0) {
      onChange({ ...value, customFields: [emptyCustomField()] });
    }
  }, [customSelected, onChange, value]);

  const showCustomFields = customSelected && !collectionSelected;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
        Choose how buyers can receive this item. Collection Only is exclusive — other options can be
        combined.
      </p>

      {collectionOption && (
        <label
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-lg border p-4',
            collectionSelected
              ? 'border-[hsl(var(--dashboard-accent))] bg-[hsl(var(--dashboard-sidebar-active)/0.4)]'
              : 'border-[hsl(var(--dashboard-sidebar-border))]',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          <input
            type="checkbox"
            className="mt-1"
            checked={collectionSelected}
            disabled={disabled}
            onChange={() => toggleOption(collectionOption.id, 'COLLECTION')}
          />
          <span>
            <span className="font-medium text-[hsl(var(--dashboard-main-fg))]">
              {collectionOption.label}
            </span>
            <span className="mt-1 block text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
              {collectionOption.description} — €{collectionOption.defaultPrice ?? 0}
            </span>
          </span>
        </label>
      )}

      {!collectionSelected && (
        <div className="space-y-3">
          {predefinedOptions.map((option) => (
            <label
              key={option.id}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-4',
                value.selectedOptionIds.includes(option.id)
                  ? 'border-[hsl(var(--dashboard-accent))] bg-[hsl(var(--dashboard-sidebar-active)/0.4)]'
                  : 'border-[hsl(var(--dashboard-sidebar-border))]',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={value.selectedOptionIds.includes(option.id)}
                disabled={disabled}
                onChange={() => toggleOption(option.id, option.zone)}
              />
              <span>
                <span className="font-medium text-[hsl(var(--dashboard-main-fg))]">
                  {option.label}
                </span>
                <span className="mt-1 block text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                  {option.description}
                  {option.defaultPrice != null ? ` — €${option.defaultPrice}` : ''}
                </span>
              </span>
            </label>
          ))}

          {customOption && (
            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-4',
                customSelected
                  ? 'border-[hsl(var(--dashboard-accent))] bg-[hsl(var(--dashboard-sidebar-active)/0.4)]'
                  : 'border-[hsl(var(--dashboard-sidebar-border))]',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={customSelected}
                disabled={disabled}
                onChange={() => toggleOption(customOption.id, 'CUSTOM')}
              />
              <span>
                <span className="font-medium text-[hsl(var(--dashboard-main-fg))]">
                  {customOption.label}
                </span>
                <span className="mt-1 block text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                  {customOption.description}
                </span>
              </span>
            </label>
          )}
        </div>
      )}

      {showCustomFields && (
        <div className="space-y-3 rounded-lg border border-dashed border-[hsl(var(--dashboard-sidebar-border))] p-4">
          <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
            Custom delivery options
          </p>
          {value.customFields.map((field, index) => (
            <div key={field.id} className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
              <div>
                <Label htmlFor={`custom-label-${field.id}`}>Label</Label>
                <Input
                  id={`custom-label-${field.id}`}
                  value={field.label}
                  disabled={disabled}
                  placeholder="e.g. Cork delivery"
                  onChange={(e) => {
                    const customFields = value.customFields.map((f) =>
                      f.id === field.id ? { ...f, label: e.target.value } : f,
                    );
                    onChange({ ...value, customFields });
                  }}
                />
              </div>
              <div>
                <Label htmlFor={`custom-price-${field.id}`}>Price (EUR)</Label>
                <Input
                  id={`custom-price-${field.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={field.price}
                  disabled={disabled}
                  onChange={(e) => {
                    const customFields = value.customFields.map((f) =>
                      f.id === field.id ? { ...f, price: e.target.value } : f,
                    );
                    onChange({ ...value, customFields });
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled || value.customFields.length <= 1}
                  onClick={() =>
                    onChange({
                      ...value,
                      customFields: value.customFields.filter((f) => f.id !== field.id),
                    })
                  }
                >
                  Remove
                </Button>
              </div>
              {index === value.customFields.length - 1 && (
                <div className="sm:col-span-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    onClick={() =>
                      onChange({
                        ...value,
                        customFields: [...value.customFields, emptyCustomField()],
                      })
                    }
                  >
                    Add another
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function validateDeliveryForm(
  catalog: DeliveryOption[],
  state: DeliveryFormState,
): string | null {
  const selections = selectionsFromDeliveryState(catalog, state);
  if (selections.length === 0) {
    return 'Select at least one delivery option.';
  }
  if (state.selectedOptionIds.some((id) => catalog.find((o) => o.id === id)?.zone === 'CUSTOM')) {
    const invalid = state.customFields.some((f) => !f.label.trim() || Number(f.price) < 0);
    if (invalid) return 'Each custom delivery option needs a label and valid price.';
  }
  return null;
}

export function useDeliveryCatalog() {
  const [catalog, setCatalog] = useState<DeliveryOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void import('@/services/delivery.service')
      .then(({ deliveryService }) => deliveryService.getCatalog())
      .then((options) => {
        if (!cancelled) setCatalog(options);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => ({ catalog, loading }), [catalog, loading]);
}
