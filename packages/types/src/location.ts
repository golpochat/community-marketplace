export interface NearbyArea {
  name: string;
  slug: string;
  listingCount: number;
}

export interface UserGeoLocation {
  latitude: number;
  longitude: number;
  label?: string;
  source: 'gps' | 'manual' | 'stored';
}

export interface ReverseGeocodeResult {
  latitude: number;
  longitude: number;
  areas: string[];
  displayName?: string;
}
