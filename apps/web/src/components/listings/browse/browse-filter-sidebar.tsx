'use client';

import { Input, Select } from '@community-marketplace/ui';
import type { Category, ListingCondition, ListingSearchFilters } from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';
import { Search } from 'lucide-react';

import {
  applyDeliveryFilter,
  applySellerTypeFilter,
  CLOTHING_SIZES,
  CONDITION_OPTIONS,
  DELIVERY_OPTIONS,
  ELECTRONICS_BRANDS,
  FURNITURE_MATERIALS,
  GENDER_OPTIONS,
  getCategoryFilterSlug,
  getDeliveryFilter,
  getSellerTypeFilter,
  isVehicleBrowseCategory,
  SERVICE_TYPES,
  STORAGE_OPTIONS,
} from '@/components/listings/browse/browse-filter-constants';
import {
  VEHICLE_BODY_TYPES,
  VEHICLE_DOORS,
  VEHICLE_ENGINE_SIZES,
  VEHICLE_FUEL_TYPES,
  VEHICLE_MAKES,
  VEHICLE_SEATS,
  VEHICLE_TRANSMISSIONS,
  modelsForMake,
  vehicleYearOptions,
} from '@/lib/vehicle-catalog';
import {
  HYBRID_CUSTOM_VALUE,
  VehicleHybridSelect,
} from '@/components/seller/vehicle-hybrid-select';

interface BrowseFilterSidebarProps {
  categories: Category[];
  filters: ListingSearchFilters;
  onChange: (filters: ListingSearchFilters) => void;
  className?: string;
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">{children}</span>;
}

function FilterSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('border-b border-gray-100 pb-3', className)}>
      <h3 className="mb-2 text-sm font-semibold text-gray-900">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <FilterLabel>{label}</FilterLabel>
      {children}
    </div>
  );
}

export function BrowseFilterSidebar({
  categories,
  filters,
  onChange,
  className,
}: BrowseFilterSidebarProps) {
  const slug = getCategoryFilterSlug(categories, filters.categoryId);
  const isVehicle = isVehicleBrowseCategory(categories, filters.categoryId);
  const delivery = getDeliveryFilter(filters);
  const sellerType = getSellerTypeFilter(filters);
  const modelOptions = filters.make ? modelsForMake(filters.make) : [];

  function update(partial: Partial<ListingSearchFilters>) {
    onChange({ ...filters, ...partial, page: 1 });
  }

  return (
    <aside className={cn('space-y-3', className)} aria-label="Listing filters">
      <FilterSection title="Search">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <Input
            placeholder="Search listings…"
            value={filters.q ?? ''}
            onChange={(e) => update({ q: e.target.value || undefined })}
            className="pl-9"
            aria-label="Search listings"
          />
        </div>
      </FilterSection>

      <FilterSection title="Category">
        <Select
          value={filters.categoryId ?? ''}
          onChange={(e) => update({ categoryId: e.target.value || undefined })}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
      </FilterSection>

      <FilterSection title="Condition">
        <Select
          value={filters.condition ?? ''}
          onChange={(e) =>
            update({ condition: (e.target.value as ListingCondition) || undefined })
          }
          aria-label="Filter by condition"
        >
          <option value="">Any condition</option>
          {CONDITION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </FilterSection>

      <FilterSection title="Price">
        <div className="grid grid-cols-2 gap-2">
          <FilterField label="Min">
            <Input
              type="number"
              min={0}
              placeholder="€0"
              value={filters.minPrice ?? ''}
              onChange={(e) =>
                update({ minPrice: e.target.value ? Number(e.target.value) : undefined })
              }
              aria-label="Minimum price"
            />
          </FilterField>
          <FilterField label="Max">
            <Input
              type="number"
              min={0}
              placeholder="Any"
              value={filters.maxPrice ?? ''}
              onChange={(e) =>
                update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
              }
              aria-label="Maximum price"
            />
          </FilterField>
        </div>
      </FilterSection>

      <FilterSection title="Delivery">
        <Select
          value={delivery}
          onChange={(e) =>
            onChange(applyDeliveryFilter(filters, e.target.value as typeof delivery))
          }
          aria-label="Filter by delivery"
        >
          {DELIVERY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </FilterSection>

      <FilterSection title="Seller">
        <FilterField label="Seller type">
          <Select
            value={sellerType}
            onChange={(e) =>
              onChange(applySellerTypeFilter(filters, e.target.value as typeof sellerType))
            }
            aria-label="Filter by seller type"
          >
            <option value="all">All sellers</option>
            <option value="private">Private</option>
            <option value="business">Business</option>
          </Select>
        </FilterField>
        <FilterField label="Seller rating">
          <Select
            value={filters.sellerVerified ? 'trusted' : filters.minSellerRating === 4 ? '4plus' : ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'trusted') {
                update({ sellerVerified: true, minSellerRating: undefined });
              } else if (value === '4plus') {
                update({ sellerVerified: undefined, minSellerRating: 4 });
              } else {
                update({ sellerVerified: undefined, minSellerRating: undefined });
              }
            }}
            aria-label="Filter by seller rating"
          >
            <option value="">Any rating</option>
            <option value="4plus">4+ stars</option>
            <option value="trusted">Trusted sellers only</option>
          </Select>
        </FilterField>
      </FilterSection>

      {isVehicle && (
        <>
          <FilterSection title="Vehicle basics">
            <VehicleHybridSelect
              id="filter-make"
              label="Make"
              value={filters.make ?? ''}
              options={VEHICLE_MAKES}
              onChange={(make) => update({ make: make || undefined, model: undefined })}
              emptyLabel="Any make"
            />
            <VehicleHybridSelect
              id="filter-model"
              label="Model"
              value={filters.model ?? ''}
              options={modelOptions.length > 0 ? modelOptions : []}
              onChange={(model) => update({ model: model || undefined })}
              disabled={!filters.make}
              emptyLabel={filters.make ? 'Any model' : 'Select make first'}
            />
            <div className="grid grid-cols-2 gap-2">
              <FilterField label="Year from">
                <Select
                  value={filters.minYear ?? ''}
                  onChange={(e) =>
                    update({ minYear: e.target.value ? Number(e.target.value) : undefined })
                  }
                  aria-label="Minimum year"
                >
                  <option value="">Any</option>
                  {vehicleYearOptions().map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </FilterField>
              <FilterField label="Year to">
                <Select
                  value={filters.maxYear ?? ''}
                  onChange={(e) =>
                    update({ maxYear: e.target.value ? Number(e.target.value) : undefined })
                  }
                  aria-label="Maximum year"
                >
                  <option value="">Any</option>
                  {vehicleYearOptions().map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </FilterField>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FilterField label="Min mileage">
                <Input
                  type="number"
                  min={0}
                  placeholder="0 km"
                  value={filters.minMileage ?? ''}
                  onChange={(e) =>
                    update({ minMileage: e.target.value ? Number(e.target.value) : undefined })
                  }
                  aria-label="Minimum mileage"
                />
              </FilterField>
              <FilterField label="Max mileage">
                <Input
                  type="number"
                  min={0}
                  placeholder="Any"
                  value={filters.maxMileage ?? ''}
                  onChange={(e) =>
                    update({ maxMileage: e.target.value ? Number(e.target.value) : undefined })
                  }
                  aria-label="Maximum mileage"
                />
              </FilterField>
            </div>
            <VehicleHybridSelect
              id="filter-fuel"
              label="Fuel type"
              value={filters.fuelType ?? ''}
              options={VEHICLE_FUEL_TYPES}
              onChange={(fuelType) => update({ fuelType: fuelType || undefined })}
              emptyLabel="Any fuel type"
            />
            <VehicleHybridSelect
              id="filter-transmission"
              label="Transmission"
              value={filters.transmission ?? ''}
              options={VEHICLE_TRANSMISSIONS}
              onChange={(transmission) => update({ transmission: transmission || undefined })}
              emptyLabel="Any transmission"
            />
            <VehicleHybridSelect
              id="filter-body"
              label="Body type"
              value={filters.bodyType ?? ''}
              options={VEHICLE_BODY_TYPES}
              onChange={(bodyType) => update({ bodyType: bodyType || undefined })}
              emptyLabel="Any body type"
            />
          </FilterSection>

          <FilterSection title="Technical">
            <VehicleHybridSelect
              id="filter-engine"
              label="Engine size"
              value={filters.engineSize ?? ''}
              options={VEHICLE_ENGINE_SIZES}
              onChange={(engineSize) => update({ engineSize: engineSize || undefined })}
              emptyLabel="Any engine size"
              formatOption={(v) => `${v} L`}
            />
            <VehicleHybridSelect
              id="filter-seats"
              label="Seats"
              value={filters.seats ?? ''}
              options={VEHICLE_SEATS}
              onChange={(seats) => update({ seats: seats || undefined })}
              emptyLabel="Any"
            />
            <VehicleHybridSelect
              id="filter-doors"
              label="Doors"
              value={filters.doors ?? ''}
              options={VEHICLE_DOORS}
              onChange={(doors) => update({ doors: doors || undefined })}
              emptyLabel="Any"
            />
          </FilterSection>
        </>
      )}

      {slug === 'electronics' && (
        <FilterSection title="Electronics">
          <VehicleHybridSelect
            id="filter-brand"
            label="Brand"
            value={filters.brand ?? ''}
            options={ELECTRONICS_BRANDS}
            onChange={(brand) => update({ brand: brand || undefined })}
            emptyLabel="Any brand"
          />
          <FilterField label="Model">
            <Input
              placeholder="e.g. iPhone 14"
              value={filters.model ?? ''}
              onChange={(e) => update({ model: e.target.value || undefined })}
              aria-label="Electronics model"
            />
          </FilterField>
          <FilterField label="Storage">
            <Select
              value={filters.storage ?? ''}
              onChange={(e) => update({ storage: e.target.value || undefined })}
              aria-label="Storage capacity"
            >
              <option value="">Any storage</option>
              {STORAGE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </FilterField>
        </FilterSection>
      )}

      {slug === 'furniture' && (
        <FilterSection title="Furniture">
          <FilterField label="Material">
            <Select
              value={filters.material ?? ''}
              onChange={(e) => update({ material: e.target.value || undefined })}
              aria-label="Furniture material"
            >
              <option value="">Any material</option>
              {FURNITURE_MATERIALS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </FilterField>
        </FilterSection>
      )}

      {slug === 'services' && (
        <FilterSection title="Services">
          <FilterField label="Service type">
            <Select
              value={filters.serviceType ?? ''}
              onChange={(e) => update({ serviceType: e.target.value || undefined })}
              aria-label="Service type"
            >
              <option value="">Any service</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </FilterField>
        </FilterSection>
      )}

      {slug === 'clothing' && (
        <FilterSection title="Clothing">
          <FilterField label="Size">
            <Select
              value={filters.clothingSize ?? ''}
              onChange={(e) => update({ clothingSize: e.target.value || undefined })}
              aria-label="Clothing size"
            >
              <option value="">Any size</option>
              {CLOTHING_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Gender">
            <Select
              value={filters.gender ?? ''}
              onChange={(e) => update({ gender: e.target.value || undefined })}
              aria-label="Gender"
            >
              <option value="">Any</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </FilterField>
        </FilterSection>
      )}
    </aside>
  );
}

// Re-export for mobile drawer usage
export { HYBRID_CUSTOM_VALUE };
