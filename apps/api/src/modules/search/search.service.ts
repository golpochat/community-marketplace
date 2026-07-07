import { Injectable } from '@nestjs/common';

import type { ReindexInput } from '@community-marketplace/validation';
import type {
  AutocompleteSuggestion,
  GlobalSearchResults,
  ReindexJobStatus,
  SearchAnalyticsSummary,
  SearchHealthResponse,
  SearchIndexMeta,
  SearchIndexName,
  SearchSynonymGroup,
} from '@community-marketplace/types';
import type {
  AutocompleteQueryInput,
  GlobalSearchQueryInput,
  ListingSearchQueryInput,
} from '@community-marketplace/validation';

import { MeilisearchService } from './services/meilisearch.service';
import { SearchAnalyticsService } from './services/search-analytics.service';
import { SearchAutocompleteService } from './services/search-autocomplete.service';
import { SearchGlobalService } from './services/search-global.service';
import { SearchIndexingService } from './services/search-indexing.service';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly meili: MeilisearchService,
    private readonly indexing: SearchIndexingService,
    private readonly autocomplete: SearchAutocompleteService,
    private readonly global: SearchGlobalService,
    private readonly analytics: SearchAnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  async health(): Promise<SearchHealthResponse> {
    const base = await this.meili.healthCheck();
    const expected = await this.getExpectedDocumentCounts();
    const indexes = base.indexes.map((index) => {
      const expectedDocumentCount = expected[index.indexName] ?? 0;
      return {
        ...index,
        expectedDocumentCount,
        syncStatus: this.resolveSyncStatus(index, expectedDocumentCount, base.healthy),
      };
    });

    return {
      healthy: base.healthy,
      mode: base.healthy ? 'meilisearch' : 'database_fallback',
      indexes,
    };
  }

  getIndexes(): SearchIndexMeta[] {
    return this.meili.getIndexes();
  }

  async reindex(input: ReindexInput): Promise<ReindexJobStatus> {
    return this.indexing.queueReindex(input);
  }

  getReindexStatus(type: SearchIndexName) {
    return this.indexing.getJobStatus(type);
  }

  suggest(input: AutocompleteQueryInput): Promise<AutocompleteSuggestion[]> {
    return this.autocomplete.suggest(input);
  }

  globalSearch(input: GlobalSearchQueryInput, isAdmin = false): Promise<GlobalSearchResults> {
    return this.global.search(input, isAdmin);
  }

  async trackListingSearch(input: ListingSearchQueryInput, resultCount: number, userId?: string) {
    if (!input.q) return;
    await this.analytics.trackSearch({
      query: input.q,
      entity: 'listings',
      resultCount,
      userId,
      metadata: { categoryId: input.categoryId },
    });
  }

  trackClick(query: string, entity: string, clickedId: string, userId?: string) {
    return this.analytics.trackClick({ query, entity, clickedId, userId });
  }

  getAnalytics(): Promise<SearchAnalyticsSummary> {
    return this.analytics.getSummary();
  }

  updateSynonyms(indexName: SearchIndexName, groups: SearchSynonymGroup[]) {
    const synonyms: Record<string, string[]> = {};
    for (const group of groups) {
      synonyms[group.id] = group.synonyms;
    }
    return this.meili.updateSynonyms(indexName, synonyms);
  }

  updateStopWords(indexName: SearchIndexName, words: string[]) {
    return this.meili.updateStopWords(indexName, words);
  }

  updateRelevanceRules(indexName: SearchIndexName, settings: Record<string, unknown>) {
    return this.meili.updateSettings(indexName, settings);
  }

  private async getExpectedDocumentCounts(): Promise<Record<SearchIndexName, number>> {
    const [listings, users, categories, chatThreads] = await Promise.all([
      this.prisma.listing.count({
        where: { status: 'active', seller: { status: 'active' } },
      }),
      this.prisma.user.count({ where: { status: 'active' } }),
      this.prisma.category.count({ where: { isActive: true } }),
      this.prisma.chatThread.count(),
    ]);

    return {
      listings,
      users,
      categories,
      chat_threads: chatThreads,
    };
  }

  private resolveSyncStatus(
    index: SearchIndexMeta,
    expectedDocumentCount: number,
    engineHealthy: boolean,
  ): SearchIndexMeta['syncStatus'] {
    if (!engineHealthy || !index.isHealthy) return 'offline';
    if (expectedDocumentCount === 0 && index.documentCount === 0) return 'synced';
    if (index.documentCount === 0 && expectedDocumentCount > 0) return 'empty';
    if (index.documentCount < expectedDocumentCount) return 'stale';
    return 'synced';
  }
}
