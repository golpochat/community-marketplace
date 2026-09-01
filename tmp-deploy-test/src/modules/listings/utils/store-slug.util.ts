const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isStoreSlugUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function slugifyStoreName(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'seller'
  );
}

export function buildStoreSlug(input: {
  id: string;
  displayName?: string | null;
  businessName?: string | null;
  preferredSlug?: string | null;
}): string {
  if (input.preferredSlug?.trim()) {
    return slugifyStoreName(input.preferredSlug.trim());
  }
  const name = input.businessName?.trim() || input.displayName?.trim() || 'seller';
  return slugifyStoreName(name);
}

export function getStoreDisplayName(input: {
  displayName?: string | null;
  businessName?: string | null;
  email: string;
}): string {
  return input.businessName?.trim() || input.displayName?.trim() || input.email.split('@')[0] || 'Seller';
}
