'use client';

import { useMemo, useState } from 'react';

import { Button } from '@community-marketplace/ui';

import { IRELAND_COUNTIES, type IrelandPlace } from '@/lib/ireland-locations';

interface LocationPickerModalProps {
  open: boolean;
  onSelect: (place: IrelandPlace & { county: string }) => void;
  onRetryGps?: () => void;
}

export function LocationPickerModal({ open, onSelect, onRetryGps }: LocationPickerModalProps) {
  const [countyName, setCountyName] = useState('');
  const [placeName, setPlaceName] = useState('');

  const county = useMemo(
    () => IRELAND_COUNTIES.find((entry) => entry.name === countyName),
    [countyName],
  );

  const place = useMemo(
    () => county?.places.find((entry) => entry.name === placeName),
    [county, placeName],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-brand-lg">
        <h2 className="text-lg font-semibold text-foreground">Choose your area</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We use your area to show nearby listings and local community buttons.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="county-select" className="text-sm font-medium text-foreground">
              County
            </label>
            <select
              id="county-select"
              value={countyName}
              onChange={(e) => {
                setCountyName(e.target.value);
                setPlaceName('');
              }}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            >
              <option value="">Select county…</option>
              {IRELAND_COUNTIES.map((entry) => (
                <option key={entry.name} value={entry.name}>
                  {entry.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="place-select" className="text-sm font-medium text-foreground">
              Town / suburb
            </label>
            <select
              id="place-select"
              value={placeName}
              disabled={!county}
              onChange={(e) => setPlaceName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm disabled:bg-muted/50"
            >
              <option value="">Select town…</option>
              {county?.places.map((entry) => (
                <option key={entry.name} value={entry.name}>
                  {entry.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="flex-1"
            disabled={!place || !county}
            onClick={() => {
              if (!place || !county) return;
              onSelect({ ...place, county: county.name });
            }}
          >
            Use this area
          </Button>
          {onRetryGps && (
            <Button type="button" variant="outline" onClick={onRetryGps}>
              Use GPS
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
