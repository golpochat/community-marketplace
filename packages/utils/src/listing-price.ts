export function isFreeListingPrice(price: number | null | undefined): boolean {
  return price != null && price <= 0;
}
