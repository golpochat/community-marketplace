import type { Listing, ListingVehicleAttributes } from '@community-marketplace/types';
import {
  formatListingConditionLabel,
  formatVehicleDate,
  hasVehicleAttributeValue,
  resolveListingVehicleSpecs,
  resolveVehicleConditionDisplay,
  resolveVehicleDoorsDisplay,
  resolveVehicleEngineSizeDisplay,
  resolveVehicleSeatsDisplay,
  resolveVehicleYearDisplay,
} from '@community-marketplace/utils';

import { ListingBadge } from '@/components/listings/listing-badge';

interface ListingSpecsSectionProps {
  listing: Listing;
}

interface SpecRow {
  label: string;
  value: string;
}

function formatMileage(mileage: number, unit?: 'km' | 'mi'): string {
  const formatted = mileage.toLocaleString('en-IE');
  return unit === 'mi' ? `${formatted} mi` : `${formatted} km`;
}

function buildSpecRows(listing: Listing, specs: ListingVehicleAttributes): SpecRow[] {
  const rows: SpecRow[] = [];

  const yearDisplay = resolveVehicleYearDisplay(specs);
  if (yearDisplay) rows.push({ label: 'Year', value: yearDisplay });
  if (hasVehicleAttributeValue(specs.make)) rows.push({ label: 'Make', value: specs.make! });
  if (hasVehicleAttributeValue(specs.model)) rows.push({ label: 'Model', value: specs.model! });
  if (hasVehicleAttributeValue(specs.bodyType)) rows.push({ label: 'Body', value: specs.bodyType! });
  if (hasVehicleAttributeValue(specs.color)) rows.push({ label: 'Colour', value: specs.color! });

  const engineDisplay = resolveVehicleEngineSizeDisplay(specs);
  if (engineDisplay) rows.push({ label: 'Engine', value: engineDisplay });
  if (hasVehicleAttributeValue(specs.fuelType)) rows.push({ label: 'Fuel', value: specs.fuelType! });
  if (hasVehicleAttributeValue(specs.transmission)) {
    rows.push({ label: 'Transmission', value: specs.transmission! });
  }
  if (specs.mileage != null) {
    rows.push({ label: 'Mileage', value: formatMileage(specs.mileage, specs.mileageUnit) });
  }
  if (hasVehicleAttributeValue(specs.chassis)) rows.push({ label: 'Chassis', value: specs.chassis! });

  const seatsDisplay = resolveVehicleSeatsDisplay(specs);
  if (seatsDisplay) rows.push({ label: 'Seats', value: seatsDisplay });
  const doorsDisplay = resolveVehicleDoorsDisplay(specs);
  if (doorsDisplay) rows.push({ label: 'Doors', value: doorsDisplay });
  if (hasVehicleAttributeValue(specs.vin)) rows.push({ label: 'VIN', value: specs.vin! });

  const nct = formatVehicleDate(specs.nctExpiry);
  if (nct) rows.push({ label: 'NCT expiry', value: nct });
  const roadTax = formatVehicleDate(specs.roadTaxExpiry);
  if (roadTax) rows.push({ label: 'Road tax', value: roadTax });
  if (specs.owners != null) rows.push({ label: 'Owners', value: String(specs.owners) });
  if (hasVehicleAttributeValue(specs.auctionGrade)) {
    rows.push({ label: 'Auction grade', value: specs.auctionGrade! });
  }

  const conditionDisplay = resolveVehicleConditionDisplay(specs, listing.condition);
  if (conditionDisplay) rows.push({ label: 'Condition', value: conditionDisplay });

  return rows;
}

function resolveVehicleSellerNotes(listing: Listing, specs: ListingVehicleAttributes): string | null {
  const description = listing.description?.trim();
  if (!description) return null;

  const title = listing.title.trim().toLowerCase();
  const normalized = description.toLowerCase();
  if (normalized === title) return null;

  const specTokens = [
    listing.title,
    resolveVehicleYearDisplay(specs),
    specs.make,
    specs.model,
    specs.fuelType,
    specs.transmission,
    specs.bodyType,
    specs.mileage != null ? formatMileage(specs.mileage, specs.mileageUnit) : undefined,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  const matchedTokens = specTokens.filter((token) => normalized.includes(token)).length;
  if (matchedTokens >= 3 && description.length <= 160 && !description.includes('\n')) {
    return null;
  }

  return description;
}

export function ListingSpecsSection({ listing }: ListingSpecsSectionProps) {
  const specs = resolveListingVehicleSpecs(listing);
  if (!specs) return null;

  const rows = buildSpecRows(listing, specs);
  const sellerNotes = resolveVehicleSellerNotes(listing, specs);

  if (rows.length === 0 && !sellerNotes) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-brand-sm">
      <h2 className="text-base font-semibold text-gray-900">Vehicle details</h2>

      {rows.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-xs text-gray-500">{row.label}</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-900">
                {row.label === 'Condition' ? (
                  <ListingBadge tone="condition" className="capitalize font-medium">
                    {row.value}
                  </ListingBadge>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {sellerNotes && (
        <div className={rows.length > 0 ? 'mt-4 border-t border-gray-100 pt-4' : 'mt-3'}>
          <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">Seller notes</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{sellerNotes}</p>
        </div>
      )}
    </section>
  );
}

export function ListingDescriptionBlock({ listing }: ListingSpecsSectionProps) {
  const hasStructuredVehicle =
    listing.attributes && Object.keys(listing.attributes).length > 0;

  if (hasStructuredVehicle) return null;

  const description = listing.description.trim();
  const conditionLabel = formatListingConditionLabel(listing.condition);
  if (!description && !conditionLabel) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-brand-sm">
      <h2 className="text-base font-semibold text-gray-900">Description</h2>
      {conditionLabel && (
        <div className="mt-3">
          <ListingBadge tone="condition" className="capitalize">
            {conditionLabel}
          </ListingBadge>
        </div>
      )}
      {description && (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{description}</p>
      )}
    </section>
  );
}
