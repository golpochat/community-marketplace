import type { Listing } from '@community-marketplace/types';
import {
  formatVehicleDate,
  hasVehicleAttributeValue,
  resolveListingVehicleSpecs,
  resolveVehicleConditionDisplay,
  resolveVehicleDoorsDisplay,
  resolveVehicleEngineSizeDisplay,
  resolveVehicleSeatsDisplay,
  resolveVehicleYearDisplay,
} from '@community-marketplace/utils';
import {
  Calendar,
  Car,
  Fuel,
  Gauge,
  History,
  Palette,
  Settings2,
  Shield,
  Users,
  Wrench,
} from 'lucide-react';

import { ListingBadge } from '@/components/listings/listing-badge';

interface ListingSpecsSectionProps {
  listing: Listing;
}

interface SpecItem {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function SpecGroup({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: SpecItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-brand-sm">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        {icon}
        {title}
      </h3>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2">
            <span className="mt-0.5 text-primary" aria-hidden>
              {item.icon}
            </span>
            <div>
              <dt className="text-xs text-gray-500">{item.label}</dt>
              <dd className="text-sm font-medium text-gray-900">{item.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

function formatMileage(mileage: number, unit?: 'km' | 'mi'): string {
  const formatted = mileage.toLocaleString();
  return unit === 'mi' ? `${formatted} mi` : `${formatted} km`;
}

export function ListingSpecsSection({ listing }: ListingSpecsSectionProps) {
  const specs = resolveListingVehicleSpecs(listing);
  if (!specs) return null;

  const overview: SpecItem[] = [];
  const yearDisplay = resolveVehicleYearDisplay(specs);
  if (yearDisplay) {
    overview.push({ label: 'Year', value: yearDisplay, icon: <Calendar className="h-4 w-4" /> });
  }
  if (hasVehicleAttributeValue(specs.make)) {
    overview.push({ label: 'Make', value: specs.make!, icon: <Car className="h-4 w-4" /> });
  }
  if (hasVehicleAttributeValue(specs.model)) {
    overview.push({ label: 'Model', value: specs.model!, icon: <Car className="h-4 w-4" /> });
  }
  if (hasVehicleAttributeValue(specs.bodyType)) {
    overview.push({ label: 'Body type', value: specs.bodyType!, icon: <Car className="h-4 w-4" /> });
  }
  if (hasVehicleAttributeValue(specs.color)) {
    overview.push({ label: 'Colour', value: specs.color!, icon: <Palette className="h-4 w-4" /> });
  }

  const technical: SpecItem[] = [];
  const engineDisplay = resolveVehicleEngineSizeDisplay(specs);
  if (engineDisplay) {
    technical.push({
      label: 'Engine size',
      value: engineDisplay,
      icon: <Settings2 className="h-4 w-4" />,
    });
  }
  if (hasVehicleAttributeValue(specs.fuelType)) {
    technical.push({ label: 'Fuel type', value: specs.fuelType!, icon: <Fuel className="h-4 w-4" /> });
  }
  if (hasVehicleAttributeValue(specs.transmission)) {
    technical.push({
      label: 'Transmission',
      value: specs.transmission!,
      icon: <Settings2 className="h-4 w-4" />,
    });
  }
  if (specs.mileage != null) {
    technical.push({
      label: 'Mileage',
      value: formatMileage(specs.mileage, specs.mileageUnit),
      icon: <Gauge className="h-4 w-4" />,
    });
  }
  if (hasVehicleAttributeValue(specs.chassis)) {
    technical.push({ label: 'Chassis code', value: specs.chassis!, icon: <Shield className="h-4 w-4" /> });
  }
  const seatsDisplay = resolveVehicleSeatsDisplay(specs);
  if (seatsDisplay) {
    technical.push({ label: 'Seats', value: seatsDisplay, icon: <Users className="h-4 w-4" /> });
  }
  const doorsDisplay = resolveVehicleDoorsDisplay(specs);
  if (doorsDisplay) {
    technical.push({ label: 'Doors', value: doorsDisplay, icon: <Car className="h-4 w-4" /> });
  }
  if (hasVehicleAttributeValue(specs.vin)) {
    technical.push({ label: 'VIN', value: specs.vin!, icon: <Shield className="h-4 w-4" /> });
  }

  const registration: SpecItem[] = [];
  const nct = formatVehicleDate(specs.nctExpiry);
  if (nct) {
    registration.push({ label: 'NCT expiry', value: nct, icon: <Calendar className="h-4 w-4" /> });
  }
  const roadTax = formatVehicleDate(specs.roadTaxExpiry);
  if (roadTax) {
    registration.push({ label: 'Road tax expiry', value: roadTax, icon: <Calendar className="h-4 w-4" /> });
  }
  if (specs.owners != null) {
    registration.push({
      label: 'Owners',
      value: String(specs.owners),
      icon: <Users className="h-4 w-4" />,
    });
  }
  if (hasVehicleAttributeValue(specs.auctionGrade)) {
    registration.push({
      label: 'Auction grade',
      value: specs.auctionGrade!,
      icon: <History className="h-4 w-4" />,
    });
  }

  const conditionDisplay = resolveVehicleConditionDisplay(specs, listing.condition);
  const sellerNotes = listing.description?.trim();
  const hasStructuredAttrs =
    listing.attributes && Object.keys(listing.attributes).length > 0;

  const hasAnySection =
    overview.length > 0 ||
    technical.length > 0 ||
    registration.length > 0 ||
    !!conditionDisplay ||
    (hasStructuredAttrs && !!sellerNotes);

  if (!hasAnySection) return null;

  return (
    <div className="mt-6 space-y-4">
      <SpecGroup
        title="Vehicle overview"
        icon={<Car className="h-4 w-4 text-primary" />}
        items={overview}
      />
      <SpecGroup
        title="Technical details"
        icon={<Settings2 className="h-4 w-4 text-primary" />}
        items={technical}
      />
      <SpecGroup
        title="Registration & legal"
        icon={<Shield className="h-4 w-4 text-primary" />}
        items={registration}
      />
      {(conditionDisplay || (hasStructuredAttrs && sellerNotes)) && (
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-brand-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Wrench className="h-4 w-4 text-primary" />
            Condition
          </h3>
          <div className="mt-3 space-y-3">
            {conditionDisplay && (
              <ListingBadge tone="condition" className="capitalize">
                {conditionDisplay}
              </ListingBadge>
            )}
            {hasStructuredAttrs && sellerNotes && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {sellerNotes}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export function ListingDescriptionBlock({ listing }: ListingSpecsSectionProps) {
  const hasStructuredVehicle =
    listing.attributes && Object.keys(listing.attributes).length > 0;

  if (hasStructuredVehicle) return null;

  const description = listing.description.trim();
  if (!description) return null;

  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-brand-sm">
      <h2 className="text-lg font-semibold text-gray-900">Description</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{description}</p>
      <div className="mt-4 flex gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span>{listing.viewCount.toLocaleString()} views</span>
        <span>{listing.favoriteCount.toLocaleString()} saves</span>
      </div>
    </section>
  );
}
