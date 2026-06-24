export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function assertDefined<T>(
  value: T | null | undefined,
  message = 'Expected value to be defined',
): asserts value is T {
  if (!isDefined(value)) {
    throw new Error(message);
  }
}

export function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

export function uniqueBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
