export type AiMarketingTask =
  | 'seo_title'
  | 'description'
  | 'keywords'
  | 'instagram_caption'
  | 'facebook_ad'
  | 'tiktok_script'
  | 'whatsapp_message'
  | 'email_campaign'
  | 'seasonal_promo'
  | 'image_enhance'
  | 'image_bg_remove'
  | 'banner_creator'
  | 'store_banner';

export type AiBillingMethod = 'free_quota' | 'wallet';

/** Admin/seller-facing deploy + publish gate for the Marketing Hub. */
export interface AiMarketingAccessStatus {
  /** Hard kill switch from AI_MARKETING_ENABLED env (false disables everywhere). */
  deployEnabled: boolean;
  /** Admin publish flag (platform settings). */
  published: boolean;
  /** True when sellers may use the hub (env allow + admin published). */
  effective: boolean;
}

export type AiBannerFormat = 'feed_square' | 'story' | 'marketplace_card' | 'storefront_hero';

export type AiBannerTemplate =
  | 'classic'
  | 'for_sale_near_you'
  | 'collection_only'
  | 'priced_to_sell';

export interface AiMarketingQuotaSummary {
  sellerVerified: boolean;
  freeQuotaUnitsMonthly: number;
  freeUnitsUsedThisMonth: number;
  freeUnitsRemaining: number;
  walletBalance: number;
  unitEurCost: number;
  dailyGenerationsUsed: number;
  dailyGenerationLimit: number;
  taskUnitCosts: Record<AiMarketingTask, number>;
  /** True when deploy env allows the hub AND admin has published it. */
  enabled: boolean;
  /** Admin/super-admin publish flag (platform settings). */
  published: boolean;
  /** Hard kill switch from AI_MARKETING_ENABLED env (false disables everywhere). */
  deployEnabled: boolean;
  imageToolsEnabled: boolean;
  backgroundRemovalAvailable: boolean;
}

export interface AiMarketingGenerateResult {
  task: AiMarketingTask;
  text: string;
  billingMethod: AiBillingMethod;
  creditUnits: number;
  amountEur: number;
  walletBalance: number;
  freeUnitsRemaining: number;
  provider: string;
  model: string;
  generationId: string;
}

export interface AiMarketingImageResult {
  task: AiMarketingTask;
  publicUrl: string;
  storageKey: string;
  bannerFormat?: AiBannerFormat;
  bannerTemplate?: AiBannerTemplate;
  billingMethod: AiBillingMethod;
  creditUnits: number;
  amountEur: number;
  walletBalance: number;
  freeUnitsRemaining: number;
  provider: string;
  model: string;
  generationId: string;
  /** True when enhance/bg-remove may be applied as a listing photo. */
  mayApplyToListing: boolean;
  /** True when store_banner export may be applied as the storefront hero. */
  mayApplyToStorefront?: boolean;
  note?: string;
}

export interface AiMarketingApplyImageResult {
  generationId: string;
  listingId: string;
  images: import('./listing').ListingImage[];
}

export interface AiMarketingApplyStoreBannerResult {
  generationId: string;
  storeId: string;
  bannerUrl: string;
}

export type AiPriceSuggestionConfidence = 'high' | 'medium' | 'low' | 'insufficient';

export interface AiPriceSuggestionResult {
  suggestedPrice: number | null;
  suggestedMin: number | null;
  suggestedMax: number | null;
  median: number | null;
  compCount: number;
  confidence: AiPriceSuggestionConfidence;
  explanation: string;
  samplePrices: number[];
  areaMatched: string | null;
  categoryId: string;
  disclaimer: string;
}

export type AiBestPostingTimeConfidence =
  | 'high'
  | 'medium'
  | 'low'
  | 'heuristic';

export type AiBestPostingTimeSource = 'stats' | 'heuristic' | 'hybrid';

export interface AiBestPostingTimeWindow {
  label: string;
  days: string[];
  startHour: number;
  endHour: number;
}

export interface AiBestPostingTimeSlot {
  /** 0 = Sunday … 6 = Saturday (Europe/Dublin). */
  dayOfWeek: number;
  hour: number;
  score: number;
  label: string;
}

export interface AiBestPostingTimeResult {
  timezone: 'Europe/Dublin';
  windows: AiBestPostingTimeWindow[];
  topSlots: AiBestPostingTimeSlot[];
  confidence: AiBestPostingTimeConfidence;
  sampleSize: number;
  source: AiBestPostingTimeSource;
  explanation: string;
  categoryId: string | null;
  categoryName: string | null;
  disclaimer: string;
}

export const AI_MARKETING_TASK_UNIT_COSTS: Record<AiMarketingTask, number> = {
  seo_title: 1,
  description: 2,
  keywords: 1,
  instagram_caption: 1,
  facebook_ad: 1,
  tiktok_script: 2,
  whatsapp_message: 1,
  email_campaign: 2,
  seasonal_promo: 1,
  image_enhance: 3,
  image_bg_remove: 5,
  banner_creator: 4,
  store_banner: 4,
};

/** Verified sellers get this many free credit units per calendar month. */
export const AI_MARKETING_FREE_UNITS_MONTHLY = 10;

/** EUR charged per credit unit when free quota is exhausted (SellNearby Credit wallet). */
export const AI_MARKETING_UNIT_EUR_COST = 0.05;

export const AI_MARKETING_DAILY_GENERATION_LIMIT = 30;

/** Max billed AI generations per listing per calendar day (when listingId is present). */
export const AI_MARKETING_LISTING_DAILY_GENERATION_LIMIT = 15;

export const AI_MARKETING_PROMPT_VERSION = 'v3-ie-en';

export const AI_MARKETING_IMAGE_PROMPT_VERSION = 'image-v2';

export const AI_MARKETING_TASK_LABELS: Record<AiMarketingTask, string> = {
  seo_title: 'SEO title',
  description: 'Description',
  keywords: 'Keywords',
  instagram_caption: 'Instagram caption',
  facebook_ad: 'Facebook post',
  tiktok_script: 'TikTok script',
  whatsapp_message: 'WhatsApp message',
  email_campaign: 'Email campaign',
  seasonal_promo: 'Seasonal promo',
  image_enhance: 'Image enhance',
  image_bg_remove: 'Background remove',
  banner_creator: 'Share banner',
  store_banner: 'Shop banner',
};

export const AI_BANNER_FORMAT_LABELS: Record<AiBannerFormat, string> = {
  feed_square: 'Feed square (1080×1080)',
  story: 'Story (1080×1920)',
  marketplace_card: 'Share card (1200×630)',
  storefront_hero: 'Storefront hero (1600×400)',
};

export const AI_BANNER_TEMPLATE_LABELS: Record<AiBannerTemplate, string> = {
  classic: 'Classic',
  for_sale_near_you: 'For sale near you',
  collection_only: 'Collection only',
  priced_to_sell: 'Priced to sell',
};

/** Tasks that can be applied directly into listing form fields. */
export const AI_MARKETING_LISTING_APPLY_TASKS: ReadonlyArray<AiMarketingTask> = [
  'seo_title',
  'description',
];

export const AI_MARKETING_IMAGE_TASKS: ReadonlyArray<AiMarketingTask> = [
  'image_enhance',
  'image_bg_remove',
  'banner_creator',
];

export function aiMarketingTaskUnitCost(task: AiMarketingTask): number {
  return AI_MARKETING_TASK_UNIT_COSTS[task];
}

export function aiMarketingTaskEurCost(task: AiMarketingTask): number {
  return Number(
    (AI_MARKETING_TASK_UNIT_COSTS[task] * AI_MARKETING_UNIT_EUR_COST).toFixed(2),
  );
}

/** Seller-facing cost chip, e.g. "2 units · ≈€0.10". */
export function formatAiMarketingTaskCostLabel(task: AiMarketingTask): string {
  const units = AI_MARKETING_TASK_UNIT_COSTS[task];
  const eur = aiMarketingTaskEurCost(task);
  return `${units} unit${units === 1 ? '' : 's'} · ≈€${eur.toFixed(2)}`;
}

/** Quota line for Marketing Hub chrome. */
export function formatAiMarketingQuotaSummary(input: {
  sellerVerified: boolean;
  freeUnitsRemaining: number;
  walletBalance: number;
}): string {
  const freePart = input.sellerVerified
    ? `${input.freeUnitsRemaining} free units left this month`
    : 'No free units until verified';
  return `${freePart} · €${input.walletBalance.toFixed(2)} credit · €${AI_MARKETING_UNIT_EUR_COST.toFixed(2)}/unit after free`;
}