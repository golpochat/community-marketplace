import type { Category } from '@community-marketplace/types';
import type { LucideIcon } from 'lucide-react';
import {
  Car,
  Flower2,
  Laptop,
  Package,
  Shirt,
  Sofa,
  Trophy,
  Wrench,
} from 'lucide-react';

const SLUG_ICON_MAP: Record<string, LucideIcon> = {
  clothing: Shirt,
  electronics: Laptop,
  furniture: Sofa,
  'home-garden': Flower2,
  other: Package,
  services: Wrench,
  'sports-outdoors': Trophy,
  vehicles: Car,
};

const NAME_ICON_MAP: Record<string, LucideIcon> = {
  Clothing: Shirt,
  Electronics: Laptop,
  Furniture: Sofa,
  'Home & Garden': Flower2,
  Other: Package,
  Services: Wrench,
  'Sports & Outdoors': Trophy,
  Vehicles: Car,
};

export function getCategoryIcon(category: Category): LucideIcon {
  if (category.icon && SLUG_ICON_MAP[category.icon]) {
    return SLUG_ICON_MAP[category.icon]!;
  }
  if (category.slug && SLUG_ICON_MAP[category.slug]) {
    return SLUG_ICON_MAP[category.slug]!;
  }
  if (NAME_ICON_MAP[category.name]) {
    return NAME_ICON_MAP[category.name]!;
  }
  return Package;
}
