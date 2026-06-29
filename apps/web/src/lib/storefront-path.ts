/** Public storefront URL for a seller (slug or user id both resolve on the API). */
export function getPublicStorefrontPath(sellerId: string): string {
  return `/store/${sellerId}`;
}
