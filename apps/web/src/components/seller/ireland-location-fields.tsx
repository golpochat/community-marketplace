'use client';

import { useMemo } from 'react';

import { Label, Select } from '@community-marketplace/ui';

import {
  IRELAND_COUNTIES,
  findIrelandCounty,
  formatIrelandListingLocationLabel,
  matchIrelandCounty,
  parseIrelandLocationLabel,
} from '@/lib/ireland-locations';

const HINT_CLASS = 'mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]';

interface IrelandCountySelectProps {
  id: string;
  label?: string;
  value: string;
  onChange: (countyName: string) => void;
  disabled?: boolean;
  required?: boolean;
  hint?: string;
  emptyLabel?: string;
}

/** Storefront location: Irish counties only. */
export function IrelandCountySelect({
  id,
  label = 'County',
  value,
  onChange,
  disabled,
  required,
  hint = 'Buyers see this as your storefront area.',
  emptyLabel = 'Select county…',
}: IrelandCountySelectProps) {
  const matched = value ? matchIrelandCounty(value)?.name ?? '' : '';

  return (
    <div>
      <Label htmlFor={id}>
        {label}
        {required ? ' *' : ''}
      </Label>
      <Select
        id={id}
        value={matched}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        className="mt-1 w-full"
      >
        <option value="">{emptyLabel}</option>
        {IRELAND_COUNTIES.map((county) => (
          <option key={county.name} value={county.name}>
            {county.name}
          </option>
        ))}
      </Select>
      {hint ? <p className={HINT_CLASS}>{hint}</p> : null}
    </div>
  );
}

export type IrelandListingLocationValue = {
  countyName: string;
  placeName: string;
  label: string;
};

interface IrelandCountyPlaceFieldsProps {
  countyId?: string;
  placeId?: string;
  /** Full listing label, usually "Town, County". */
  value: string;
  onChange: (next: IrelandListingLocationValue) => void;
  disabled?: boolean;
  required?: boolean;
  hint?: string;
}

/** Listing location: county, then town / suburb for that county. */
export function IrelandCountyPlaceFields({
  countyId = 'listing-county',
  placeId = 'listing-place',
  value,
  onChange,
  disabled,
  required,
  hint = 'Where buyers can collect the item or where delivery starts from.',
}: IrelandCountyPlaceFieldsProps) {
  const parsed = useMemo(() => parseIrelandLocationLabel(value), [value]);
  const countyName = parsed?.county.name ?? '';
  const placeName = parsed?.place?.name ?? '';
  const county = findIrelandCounty(countyName);

  function handleCountyChange(nextCountyName: string) {
    if (!nextCountyName) {
      onChange({ countyName: '', placeName: '', label: '' });
      return;
    }
    onChange({
      countyName: nextCountyName,
      placeName: '',
      label: nextCountyName,
    });
  }

  function handlePlaceChange(nextPlaceName: string) {
    if (!countyName || !nextPlaceName) {
      onChange({
        countyName,
        placeName: '',
        label: countyName,
      });
      return;
    }
    onChange({
      countyName,
      placeName: nextPlaceName,
      label: formatIrelandListingLocationLabel(nextPlaceName, countyName),
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={countyId}>
          County
          {required ? ' *' : ''}
        </Label>
        <Select
          id={countyId}
          value={countyName}
          onChange={(event) => handleCountyChange(event.target.value)}
          disabled={disabled}
          required={required}
          className="mt-1 w-full"
        >
          <option value="">Select county…</option>
          {IRELAND_COUNTIES.map((entry) => (
            <option key={entry.name} value={entry.name}>
              {entry.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor={placeId}>
          Town / area
          {required ? ' *' : ''}
        </Label>
        <Select
          id={placeId}
          value={placeName}
          onChange={(event) => handlePlaceChange(event.target.value)}
          disabled={disabled || !county}
          required={required}
          className="mt-1 w-full"
        >
          <option value="">
            {county ? 'Select town or area…' : 'Select a county first…'}
          </option>
          {county?.places.map((place) => (
            <option key={place.name} value={place.name}>
              {place.name}
            </option>
          ))}
        </Select>
        {hint ? <p className={HINT_CLASS}>{hint}</p> : null}
      </div>
    </div>
  );
}

/** Seed listing location county from a storefront location string. */
export function defaultListingLocationFromStore(
  storeLocation?: string | null,
): IrelandListingLocationValue | null {
  if (!storeLocation?.trim()) return null;
  const parsed = parseIrelandLocationLabel(storeLocation);
  if (parsed?.place) {
    return {
      countyName: parsed.county.name,
      placeName: parsed.place.name,
      label: formatIrelandListingLocationLabel(
        parsed.place.name,
        parsed.county.name,
      ),
    };
  }
  const county = parsed?.county ?? matchIrelandCounty(storeLocation);
  if (!county) return null;
  // County-only storefront: preselect county; seller still picks town/area.
  return {
    countyName: county.name,
    placeName: '',
    label: county.name,
  };
}

export function isCompleteIrelandListingLocation(label: string): boolean {
  const parsed = parseIrelandLocationLabel(label);
  return Boolean(parsed?.place);
}
