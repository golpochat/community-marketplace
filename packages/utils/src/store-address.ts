import { formatLocationLabel } from './location';

export interface ParsedStoreAddress {
  city: string | null;
  addressLine: string | null;
}

/** Split location/address for storefront display with city highlighted first. */
export function parseStoreAddress(
  location?: string | null,
  address?: string | null,
): ParsedStoreAddress {
  const normalizedLocation = location ? formatLocationLabel(location) : '';
  const normalizedAddress = address?.trim().replace(/\s+/g, ' ') ?? '';

  if (normalizedLocation) {
    const [city, ...rest] = normalizedLocation.split(',').map((part) => part.trim()).filter(Boolean);
    return {
      city: city ?? null,
      addressLine: normalizedAddress || (rest.length > 0 ? rest.join(', ') : null),
    };
  }

  if (normalizedAddress) {
    const parts = normalizedAddress.split(',').map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const cityCandidate = parts[parts.length - 2] ?? parts[0];
      return {
        city: cityCandidate ?? null,
        addressLine: normalizedAddress,
      };
    }
    return { city: null, addressLine: normalizedAddress };
  }

  return { city: null, addressLine: null };
}
