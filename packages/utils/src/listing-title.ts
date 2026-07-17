export const LISTING_TITLE_MIN_LENGTH = 10;
export const LISTING_TITLE_MAX_LENGTH = 100;
export const LISTING_DESCRIPTION_SOFT_MAX = 2000;
export const LISTING_DESCRIPTION_HARD_MAX = 5000;

const JUNK_TITLES = new Set([
  'car',
  'nice',
  'item',
  'sale',
  'test',
  'hello',
  'hi',
  'baby cott',
  'cot',
  'bike',
  'phone',
  'laptop',
  'table',
  'chair',
  'sofa',
  'free',
  'stuff',
  'things',
  'for sale',
  'listing',
]);

const SMALL_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);

export function normalizeListingTitle(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed) return trimmed;

  return trimmed
    .split(' ')
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && SMALL_WORDS.has(lower)) {
        return lower;
      }
      if (word.length <= 2) {
        return word.toUpperCase();
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

export function isBlockedListingTitle(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (JUNK_TITLES.has(normalized)) return true;

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 1 && words[0]!.length < 5) return true;

  return false;
}

export function isDescriptiveListingTitle(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < LISTING_TITLE_MIN_LENGTH) return false;
  if (trimmed.length > LISTING_TITLE_MAX_LENGTH) return false;
  if (isBlockedListingTitle(trimmed)) return false;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words.every((word) => word.length >= 2);
  }

  return trimmed.length >= 15;
}

export function listingTitleValidationMessage(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < LISTING_TITLE_MIN_LENGTH) {
    return `Title must be at least ${LISTING_TITLE_MIN_LENGTH} characters.`;
  }
  if (trimmed.length > LISTING_TITLE_MAX_LENGTH) {
    return `Title must be at most ${LISTING_TITLE_MAX_LENGTH} characters.`;
  }
  if (isBlockedListingTitle(trimmed)) {
    return 'This title is too vague. Add more detail about the item you are selling.';
  }
  if (!isDescriptiveListingTitle(trimmed)) {
    return 'Use a descriptive title with at least two words (e.g. "2015 Nissan Note automatic").';
  }
  return null;
}

/** Minimum Jaccard token overlap to treat a title change as an amendment (not a rewrite). */
export const TITLE_AMEND_MIN_SIMILARITY = 0.6;

export function tokenizeListingTitle(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

/** Jaccard similarity of significant title tokens (0–1). */
export function listingTitleSimilarity(a: string, b: string): number {
  const left = new Set(tokenizeListingTitle(a));
  const right = new Set(tokenizeListingTitle(b));
  if (left.size === 0 && right.size === 0) return 1;
  if (left.size === 0 || right.size === 0) return 0;

  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }
  const union = left.size + right.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function isListingTitleAmendment(liveTitle: string, proposedTitle: string): boolean {
  const live = normalizeListingTitle(liveTitle);
  const proposed = normalizeListingTitle(proposedTitle);
  if (live === proposed) return true;
  return listingTitleSimilarity(live, proposed) >= TITLE_AMEND_MIN_SIMILARITY;
}
