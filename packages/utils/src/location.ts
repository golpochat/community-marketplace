/** Normalize spacing and comma formatting for listing locations. */
export function formatLocationLabel(label: string): string {
  const trimmed = label.trim().replace(/\s+/g, ' ');
  if (!trimmed) return trimmed;

  return trimmed
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
}
