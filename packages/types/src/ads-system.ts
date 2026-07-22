export type AdsSystemModuleCode =
  | 'display_advertising'
  | 'listing_boost'
  | 'featured_slots';

export type DisplayAdPlacement =
  | 'homepage_leaderboard'
  | 'category_sidebar'
  | 'search_results_inline';

export interface AdsSystemModuleState {
  code: AdsSystemModuleCode;
  published: boolean;
  effective: boolean;
  preview: boolean;
}

export interface AdsSystemStatus {
  feature: 'ads_system';
  systemEnabled: boolean;
  previewMode: boolean;
  modules: AdsSystemModuleState[];
}

export interface DisplayAdSlot {
  placement: DisplayAdPlacement;
  label: string;
  width: number;
  height: number;
  preview: boolean;
  /** Present when an admin campaign is live for this slot. */
  creative?: DisplayAdCreative | null;
}

export interface DisplayAdCreative {
  campaignId: string;
  imageUrl: string;
  /** Tracking redirect URL (counts click, then 302 to destination). */
  clickUrl: string;
  altText?: string;
  advertiserName: string;
}

export type DisplayAdCampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'live'
  | 'paused'
  | 'ended';

export interface DisplayAdCampaign {
  id: string;
  advertiserName: string;
  advertiserEmail?: string;
  advertiserNotes?: string;
  placement: DisplayAdPlacement;
  status: DisplayAdCampaignStatus;
  startsAt: string;
  endsAt: string;
  imageKey: string;
  imageUrl: string;
  clickUrl: string;
  altText?: string;
  priority: number;
  impressionCount: number;
  clickCount: number;
  createdByAdminId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisplayAdsPlacementsResponse {
  enabled: boolean;
  preview: boolean;
  context: string;
  slots: DisplayAdSlot[];
}

export const DISPLAY_AD_PLACEMENTS = [
  'homepage_leaderboard',
  'category_sidebar',
  'search_results_inline',
] as const satisfies readonly DisplayAdPlacement[];

export function isDisplayAdPlacement(value: string): value is DisplayAdPlacement {
  return (DISPLAY_AD_PLACEMENTS as readonly string[]).includes(value);
}
