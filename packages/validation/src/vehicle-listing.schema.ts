import { z } from 'zod';

import { listingConditionSchema } from './listing.schema';

export const listingVehicleAttributesSchema = z
  .object({
    make: z.string().min(1).max(80).optional(),
    model: z.string().min(1).max(80).optional(),
    year: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
    bodyType: z.string().max(40).optional(),
    color: z.string().max(40).optional(),
    engineSize: z.number().min(0.1).max(10).optional(),
    fuelType: z.string().max(40).optional(),
    transmission: z.string().max(40).optional(),
    mileage: z.number().min(0).max(2_000_000).optional(),
    mileageUnit: z.enum(['km', 'mi']).optional(),
    chassis: z.string().max(40).optional(),
    seats: z.number().int().min(1).max(12).optional(),
    doors: z.number().int().min(2).max(5).optional(),
    vin: z.string().max(17).optional(),
    nctExpiry: z.string().max(30).optional(),
    roadTaxExpiry: z.string().max(30).optional(),
    owners: z.number().int().min(0).max(20).optional(),
    auctionGrade: z.string().max(10).optional(),
    isHybrid: z.boolean().optional(),
    engineCc: z.number().int().min(50).max(10_000).optional(),
    steering: z.enum(['RHD', 'LHD']).optional(),
    yearText: z.string().max(20).optional(),
    engineSizeText: z.string().max(40).optional(),
    seatsText: z.string().max(20).optional(),
    doorsText: z.string().max(20).optional(),
    conditionLabel: z.string().max(80).optional(),
    conditionSet: z.boolean().optional(),
  })
  .strict();

export const vehicleListingCreateSchema = z.object({
  make: z.string().min(1, 'Select a make'),
  model: z.string().min(1, 'Select a model'),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  fuelType: z.string().min(1, 'Select fuel type'),
  transmission: z.string().min(1, 'Select transmission'),
  mileage: z.number().min(0, 'Enter mileage'),
  mileageUnit: z.enum(['km', 'mi']).default('km'),
  condition: listingConditionSchema,
  bodyType: z.string().optional(),
  color: z.string().optional(),
  engineSize: z.number().optional(),
  chassis: z.string().optional(),
  seats: z.number().int().optional(),
  doors: z.number().int().optional(),
  vin: z.string().optional(),
  nctExpiry: z.string().optional(),
  roadTaxExpiry: z.string().optional(),
  owners: z.number().int().optional(),
  auctionGrade: z.string().optional(),
  sellerNotes: z.string().optional(),
});

export type VehicleListingFormFields = z.infer<typeof vehicleListingCreateSchema>;

export function stripEmptyVehicleAttributes(
  attrs: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === '') continue;
    if (typeof value === 'number' && Number.isNaN(value)) continue;
    out[key] = value;
  }
  return out;
}
