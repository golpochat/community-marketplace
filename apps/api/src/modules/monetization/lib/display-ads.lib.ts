import type { DisplayAdPlacement } from '@community-marketplace/types';

export interface DisplayAdPlacementDefinition {
  placement: DisplayAdPlacement;
  label: string;
  width: number;
  height: number;
  contexts: string[];
}

export const DISPLAY_AD_PLACEMENT_DEFINITIONS: DisplayAdPlacementDefinition[] = [
  {
    placement: 'homepage_leaderboard',
    label: 'Homepage leaderboard',
    width: 728,
    height: 90,
    contexts: ['homepage'],
  },
  {
    placement: 'category_sidebar',
    label: 'Category sidebar',
    width: 300,
    height: 250,
    contexts: ['category', 'browse'],
  },
  {
    placement: 'search_results_inline',
    label: 'Search results inline',
    width: 320,
    height: 100,
    contexts: ['search', 'browse'],
  },
];

export function getDisplayAdPlacementsForContext(context: string) {
  const normalized = context.trim().toLowerCase() || 'homepage';
  return DISPLAY_AD_PLACEMENT_DEFINITIONS.filter((definition) =>
    definition.contexts.includes(normalized),
  );
}
