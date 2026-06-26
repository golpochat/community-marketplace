'use client';

import { useEffect, useMemo, useState } from 'react';

import { Input, Label, Select } from '@community-marketplace/ui';

export const HYBRID_CUSTOM_VALUE = '__custom__';

export function toOptionStrings(options: ReadonlyArray<string | number>): string[] {
  return options.map(String);
}

export function isPreloadedOption(value: string, options: string[]): boolean {
  return value !== '' && options.includes(value);
}

interface VehicleHybridSelectProps {
  id: string;
  label: string;
  value: string;
  options: ReadonlyArray<string | number>;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  emptyLabel?: string;
  customPlaceholder?: string;
  formatOption?: (value: string) => string;
}

export function VehicleHybridSelect({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
  required = false,
  error,
  emptyLabel = 'Select…',
  customPlaceholder = 'Enter custom value',
  formatOption = (v) => v,
}: VehicleHybridSelectProps) {
  const optionStrings = useMemo(() => toOptionStrings(options), [options]);

  const derived = useMemo(() => {
    if (!value) {
      return { selectValue: '', customText: '', isCustom: false };
    }
    if (isPreloadedOption(value, optionStrings)) {
      return { selectValue: value, customText: '', isCustom: false };
    }
    return { selectValue: HYBRID_CUSTOM_VALUE, customText: value, isCustom: true };
  }, [value, optionStrings]);

  const [selectValue, setSelectValue] = useState(derived.selectValue);
  const [customText, setCustomText] = useState(derived.customText);

  useEffect(() => {
    setSelectValue(derived.selectValue);
    setCustomText(derived.customText);
  }, [derived.selectValue, derived.customText]);

  function handleSelectChange(next: string) {
    setSelectValue(next);
    if (next === '') {
      setCustomText('');
      onChange('');
      return;
    }
    if (next === HYBRID_CUSTOM_VALUE) {
      setCustomText('');
      onChange('');
      return;
    }
    setCustomText('');
    onChange(next);
  }

  function handleCustomChange(next: string) {
    setCustomText(next);
    onChange(next.trim());
  }

  const showCustomInput = selectValue === HYBRID_CUSTOM_VALUE;

  return (
    <div>
      <Label htmlFor={id}>
        {label}
        {required ? ' *' : ''}
      </Label>
      <Select
        id={id}
        value={selectValue}
        onChange={(e) => handleSelectChange(e.target.value)}
        disabled={disabled}
        className="mt-1"
      >
        <option value="">{emptyLabel}</option>
        {optionStrings.map((option) => (
          <option key={option} value={option}>
            {formatOption(option)}
          </option>
        ))}
        <option value={HYBRID_CUSTOM_VALUE}>Other / Custom</option>
      </Select>
      {showCustomInput && (
        <Input
          id={`${id}-custom`}
          value={customText}
          onChange={(e) => handleCustomChange(e.target.value)}
          placeholder={customPlaceholder}
          disabled={disabled}
          className="mt-2"
        />
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface VehicleMakeModelFieldsProps {
  make: string;
  model: string;
  makeError?: string;
  modelError?: string;
  disabled?: boolean;
  makeRequired?: boolean;
  modelRequired?: boolean;
  onMakeChange: (make: string) => void;
  onModelChange: (model: string) => void;
  makes: readonly string[];
  modelsForMake: (make: string) => string[];
}

export function VehicleMakeModelFields({
  make,
  model,
  makeError,
  modelError,
  disabled = false,
  makeRequired = false,
  modelRequired = false,
  onMakeChange,
  onModelChange,
  makes,
  modelsForMake,
}: VehicleMakeModelFieldsProps) {
  const makeOptions = toOptionStrings(makes);
  const isCustomMake = make !== '' && !isPreloadedOption(make, makeOptions);
  const modelOptions = isCustomMake ? [] : modelsForMake(make);

  function handleMakeChange(nextMake: string) {
    onMakeChange(nextMake);
    onModelChange('');
  }

  return (
    <>
      <VehicleHybridSelect
        id="make"
        label="Make"
        value={make}
        options={makeOptions}
        onChange={handleMakeChange}
        disabled={disabled}
        required={makeRequired}
        error={makeError}
        emptyLabel="Select make"
        customPlaceholder="Enter make"
      />
      {isCustomMake ? (
        <div>
          <Label htmlFor="model-custom">
            Model{modelRequired ? ' *' : ''}
          </Label>
          <Input
            id="model-custom"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder="Enter model"
            disabled={disabled}
            className="mt-1"
          />
          {modelError && <p className="mt-1 text-xs text-red-600">{modelError}</p>}
        </div>
      ) : (
        <VehicleHybridSelect
          id="model"
          label="Model"
          value={model}
          options={modelOptions}
          onChange={onModelChange}
          disabled={disabled || !make}
          required={modelRequired}
          error={modelError}
          emptyLabel={make ? 'Select model' : 'Select make first'}
          customPlaceholder="Enter model"
        />
      )}
    </>
  );
}
