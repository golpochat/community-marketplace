import { buildVehicleListingTitle as buildVehicleListingTitleFromUtils } from '@community-marketplace/utils';

export const VEHICLE_MAKES = [
  'Toyota',
  'Nissan',
  'Honda',
  'Mazda',
  'Mitsubishi',
  'Subaru',
  'Suzuki',
  'Lexus',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Volkswagen',
  'Skoda',
  'Ford',
  'Hyundai',
  'Kia',
  'Peugeot',
  'Renault',
  'Opel',
  'Volvo',
  'Land Rover',
  'Jaguar',
  'Tesla',
  'Mini',
] as const;

export type VehicleMake = (typeof VEHICLE_MAKES)[number];

export const VEHICLE_MODELS: Record<VehicleMake, string[]> = {
  Toyota: ['Aqua', 'Prius', 'Corolla', 'Yaris', 'CHR', 'RAV4', 'Camry', 'Land Cruiser'],
  Nissan: ['Note', 'Leaf', 'Qashqai', 'X-Trail', 'Juke', 'Skyline', 'Micra', 'Navara'],
  Honda: ['Fit', 'Civic', 'Vezel', 'Accord', 'Shuttle', 'CR-V', 'Jazz', 'HR-V'],
  Mazda: ['2', '3', '6', 'CX-3', 'CX-5', 'CX-30', 'MX-5', 'CX-60'],
  Mitsubishi: ['Outlander', 'ASX', 'L200', 'Space Star', 'Eclipse Cross', 'Pajero'],
  Subaru: ['Impreza', 'Forester', 'Outback', 'XV', 'Legacy', 'BRZ', 'Crosstrek'],
  Suzuki: ['Swift', 'Vitara', 'Jimny', 'Ignis', 'S-Cross', 'Baleno'],
  Lexus: ['IS', 'ES', 'NX', 'RX', 'UX', 'CT', 'LC'],
  BMW: ['1 Series', '3 Series', '5 Series', 'X1', 'X3', 'X5', 'i3', 'i4'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'GLA', 'GLC', 'GLE', 'Sprinter'],
  Audi: ['A1', 'A3', 'A4', 'A6', 'Q2', 'Q3', 'Q5', 'Q7', 'e-tron'],
  Volkswagen: ['Polo', 'Golf', 'Passat', 'Tiguan', 'T-Roc', 'ID.3', 'ID.4', 'Transporter'],
  Skoda: ['Fabia', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq'],
  Ford: ['Fiesta', 'Focus', 'Mondeo', 'Puma', 'Kuga', 'Ranger', 'Mustang Mach-E'],
  Hyundai: ['i10', 'i20', 'i30', 'Tucson', 'Kona', 'Santa Fe', 'Ioniq 5'],
  Kia: ['Picanto', 'Rio', 'Ceed', 'Sportage', 'Niro', 'Sorento', 'EV6'],
  Peugeot: ['208', '308', '3008', '5008', '2008', 'Partner', 'Rifter'],
  Renault: ['Clio', 'Captur', 'Megane', 'Kadjar', 'Scenic', 'Kangoo', 'Zoe'],
  Opel: ['Corsa', 'Astra', 'Mokka', 'Crossland', 'Grandland', 'Combo'],
  Volvo: ['XC40', 'XC60', 'XC90', 'V40', 'V60', 'V90', 'C40'],
  'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport'],
  Jaguar: ['XE', 'XF', 'F-Pace', 'E-Pace', 'I-Pace', 'F-Type'],
  Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X'],
  Mini: ['Hatch', 'Clubman', 'Countryman', 'Convertible', 'Electric'],
};

export const VEHICLE_TRANSMISSIONS = [
  'Automatic',
  'Manual',
  'CVT',
  'e-Power',
  'Hybrid Automatic',
] as const;

export const VEHICLE_FUEL_TYPES = [
  'Petrol',
  'Diesel',
  'Hybrid',
  'Plug-in Hybrid',
  'Electric',
] as const;

export const VEHICLE_ENGINE_SIZES = [
  0.6, 0.8, 1.0, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.5, 3.0, 3.5, 4.0,
] as const;

export const VEHICLE_BODY_TYPES = [
  'Hatchback',
  'Saloon',
  'SUV',
  'MPV',
  'Estate',
  'Coupe',
  'Van',
  'Pickup',
] as const;

export const VEHICLE_COLOURS = [
  'White',
  'Black',
  'Silver',
  'Grey',
  'Blue',
  'Red',
  'Green',
  'Yellow',
  'Brown',
  'Gold',
] as const;

export const VEHICLE_DOORS = [2, 3, 4, 5] as const;
export const VEHICLE_SEATS = [2, 4, 5, 6, 7, 8] as const;
export const VEHICLE_AUCTION_GRADES = ['3', '3.5', '4', '4.5', '5', 'R', 'RA'] as const;

export const VEHICLE_CONDITION_OPTIONS = [
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Needs Work' },
] as const;

export function vehicleYearOptions(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current + 1; y >= 1990; y -= 1) {
    years.push(y);
  }
  return years;
}

export function modelsForMake(make: string): string[] {
  return VEHICLE_MODELS[make as VehicleMake] ?? [];
}

export function buildVehicleListingTitle(
  year?: number | string,
  make?: string,
  model?: string,
): string {
  return buildVehicleListingTitleFromUtils(year, make, model);
}

export function isVehicleCategory(category: { slug?: string; name?: string }): boolean {
  const slug = category.slug?.toLowerCase();
  const name = category.name?.toLowerCase();
  return slug === 'vehicles' || name === 'vehicles' || name === 'vehicle';
}
