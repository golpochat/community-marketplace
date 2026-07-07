export type SearchIndexName =
  | 'listings'
  | 'users'
  | 'categories'
  | 'chat_threads';

export type SearchEntityType = 'listings' | 'users' | 'categories' | 'sellers' | 'global';

export interface SearchIndexMeta {
  id: string;
  indexName: SearchIndexName;
  type: SearchIndexName;
  documentCount: number;
  /** Active records in the database expected to be searchable. */
  expectedDocumentCount?: number;
  isHealthy: boolean;
  /** Set when a full reindex completes successfully. */
  lastSyncedAt?: string;
  /** Set when live stats were last pulled from Meilisearch. */
  statsUpdatedAt?: string;
  syncStatus?: 'synced' | 'empty' | 'stale' | 'offline';
  createdAt: string;
  updatedAt: string;
}

export interface SearchHealthResponse {
  healthy: boolean;
  mode: 'meilisearch' | 'database_fallback';
  indexes: SearchIndexMeta[];
}

export interface ListingSearchDocument {
  id: string;
  sellerId: string;
  sellerName?: string;
  sellerVerified?: boolean;
  title: string;
  description: string;
  price: number;
  currency: string;
  categoryId: string;
  categorySlug: string;
  categoryName?: string;
  condition: string;
  status: string;
  locationLabel: string;
  _geo: { lat: number; lng: number };
  imageUrl?: string;
  favoriteCount: number;
  viewCount: number;
  boostedUntil: number;
  isBoosted: boolean;
  createdAt: number;
  sellerStatus: string;
  embedding?: number[];
}

export interface UserSearchDocument {
  id: string;
  displayName: string;
  avatarUrl?: string;
  sellerVerified: boolean;
  role: string;
  status: string;
}

export interface CategorySearchDocument {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  parentSlug?: string;
  isActive: boolean;
}

export interface ChatThreadSearchDocument {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerId: string;
  sellerId: string;
}

export interface SearchHit<T = Record<string, unknown>> {
  document: T;
  score?: number;
}

export interface SearchResults<T = Record<string, unknown>> {
  hits: SearchHit<T>[];
  query: string;
  processingTimeMs: number;
  estimatedTotalHits: number;
  limit: number;
  offset: number;
  nextCursor?: string;
}

export interface AutocompleteSuggestion {
  type: 'listing' | 'category' | 'seller';
  id: string;
  label: string;
  meta?: Record<string, unknown>;
}

export interface GlobalSearchResults {
  listings: SearchHit<ListingSearchDocument>[];
  categories: SearchHit<CategorySearchDocument>[];
  sellers: SearchHit<UserSearchDocument>[];
  query: string;
  processingTimeMs: number;
}

export interface SearchAnalyticsSummary {
  popularKeywords: Array<{ query: string; count: number }>;
  zeroResultQueries: Array<{ query: string; count: number }>;
  trendingCategories: Array<{ categoryId: string; count: number }>;
  totalSearches: number;
  clickThroughRate: number;
}

export interface ReindexJobStatus {
  type: SearchIndexName;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  indexed?: number;
  error?: string;
}

export interface SearchSynonymGroup {
  id: string;
  synonyms: string[];
}
