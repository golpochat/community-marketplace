import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MeiliSearch, type Index } from 'meilisearch';

import type { ListingSortOption, SearchIndexMeta, SearchIndexName } from '@community-marketplace/types';

import { LoggerLib } from '../../../libs/logger.lib';

export interface ListingSearchOptions {
  limit?: number;
  offset?: number;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  sort?: ListingSortOption;
  includeRestricted?: boolean;
  cursor?: string;
}

const MAX_RETRIES = 3;

@Injectable()
export class MeilisearchService implements OnModuleInit, OnModuleDestroy {
  private client: MeiliSearch | null = null;
  private readonly indexMeta = new Map<SearchIndexName, SearchIndexMeta>();
  private connectFailureLogged = false;

  constructor(private readonly logger: LoggerLib) {}

  async onModuleInit() {
    this.seedIndexMeta();
    await this.tryConnect(true);
  }

  onModuleDestroy() {
    this.client = null;
  }

  isAvailable(): boolean {
    return this.client != null;
  }

  async healthCheck(): Promise<{ healthy: boolean; indexes: SearchIndexMeta[] }> {
    if (!this.client) {
      await this.tryConnect(false);
    }
    if (!this.client) return { healthy: false, indexes: this.getIndexes() };
    try {
      await this.client.health();
      for (const name of this.indexMeta.keys()) {
        const meta = this.indexMeta.get(name);
        if (!meta) continue;
        try {
          const stats = await this.client.index(name).getStats();
          meta.documentCount = stats.numberOfDocuments;
          meta.isHealthy = true;
          const now = new Date().toISOString();
          meta.updatedAt = now;
          meta.statsUpdatedAt = now;
        } catch {
          meta.isHealthy = false;
        }
      }
      return { healthy: true, indexes: this.getIndexes() };
    } catch {
      for (const meta of this.indexMeta.values()) {
        meta.isHealthy = false;
      }
      return { healthy: false, indexes: this.getIndexes() };
    }
  }

  async withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, attempt * 200));
        }
      }
    }
    this.logger.log('MeilisearchService', `${label} failed after ${MAX_RETRIES} attempts`);
    throw lastError;
  }

  async search(indexName: SearchIndexName, query: string, options: Record<string, unknown> = {}) {
    const index = this.getIndex(indexName);
    if (!index) {
      return {
        hits: [],
        query,
        processingTimeMs: 0,
        limit: (options.limit as number) ?? 20,
        offset: (options.offset as number) ?? 0,
        estimatedTotalHits: 0,
      };
    }

    return this.withRetry(() => index.search(query, options), `search:${indexName}`);
  }

  async searchListings(query: string, options: ListingSearchOptions) {
    const index = this.getIndex('listings');
    if (!index) return { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 };

    const filter: string[] = [];
    if (!options.includeRestricted) {
      filter.push('status IN [active, reserved]', 'sellerStatus = active');
    }
    if (options.categoryId) filter.push(`categoryId = "${options.categoryId}"`);
    if (options.condition) filter.push(`condition = "${options.condition}"`);
    if (options.minPrice !== undefined) filter.push(`price >= ${options.minPrice}`);
    if (options.maxPrice !== undefined) filter.push(`price <= ${options.maxPrice}`);
    if (options.cursor) filter.push(`createdAt < ${options.cursor}`);

    const sort = this.resolveMeiliSort(options.sort);
    const searchParams: Record<string, unknown> = {
      limit: options.limit ?? 20,
      offset: options.offset ?? 0,
      ...(filter.length ? { filter: filter.join(' AND ') } : {}),
      ...(sort ? { sort } : {}),
    };

    if (
      options.latitude !== undefined &&
      options.longitude !== undefined &&
      options.radiusKm
    ) {
      const geoFilter = `_geoRadius(${options.latitude}, ${options.longitude}, ${options.radiusKm * 1000})`;
      searchParams.filter = filter.length
        ? `${filter.join(' AND ')} AND ${geoFilter}`
        : geoFilter;
    }

    const result = await this.withRetry(
      () => index.search(query, searchParams),
      'searchListings',
    );

    return {
      hits: result.hits,
      estimatedTotalHits: result.estimatedTotalHits ?? result.hits.length,
      processingTimeMs: result.processingTimeMs,
    };
  }

  async autocomplete(indexName: SearchIndexName, query: string, limit = 8) {
    return this.search(indexName, query, {
      limit,
      attributesToRetrieve: ['id', 'title', 'name', 'displayName', 'slug', 'sellerName'],
    });
  }

  async indexDocuments(indexName: SearchIndexName, documents: object[]) {
    const index = this.getIndex(indexName);
    if (!index || !documents.length) return { indexed: 0 };

    try {
      const task = await this.withRetry(() => index.addDocuments(documents), `index:${indexName}`);
      this.bumpMeta(indexName, documents.length);
      return { indexed: documents.length, taskUid: task.taskUid };
    } catch {
      this.logger.log('MeilisearchService', `index:${indexName} skipped — Meilisearch error`);
      return { indexed: 0 };
    }
  }

  async updateDocuments(indexName: SearchIndexName, documents: object[]) {
    return this.indexDocuments(indexName, documents);
  }

  async deleteDocument(indexName: SearchIndexName, documentId: string) {
    const index = this.getIndex(indexName);
    if (!index) return;
    await this.withRetry(() => index.deleteDocument(documentId), `delete:${indexName}`);
  }

  async deleteAllDocuments(indexName: SearchIndexName) {
    const index = this.getIndex(indexName);
    if (!index) return;
    try {
      await this.withRetry(() => index.deleteAllDocuments(), `deleteAll:${indexName}`);
      const meta = this.indexMeta.get(indexName);
      if (meta) meta.documentCount = 0;
    } catch {
      this.logger.log('MeilisearchService', `deleteAll:${indexName} skipped — Meilisearch error`);
    }
  }

  getIndexes(): SearchIndexMeta[] {
    return [...this.indexMeta.values()];
  }

  markIndexSynced(indexName: SearchIndexName, documentCount: number) {
    const meta = this.indexMeta.get(indexName);
    if (!meta) return;
    const now = new Date().toISOString();
    meta.documentCount = documentCount;
    meta.lastSyncedAt = now;
    meta.updatedAt = now;
    meta.statsUpdatedAt = now;
    meta.isHealthy = true;
  }

  async updateSynonyms(indexName: SearchIndexName, synonyms: Record<string, string[]>) {
    const index = this.getIndex(indexName);
    if (!index) return;
    await this.withRetry(() => index.updateSynonyms(synonyms), `synonyms:${indexName}`);
  }

  async updateStopWords(indexName: SearchIndexName, words: string[]) {
    const index = this.getIndex(indexName);
    if (!index) return;
    await this.withRetry(() => index.updateStopWords(words), `stopWords:${indexName}`);
  }

  async updateSettings(indexName: SearchIndexName, settings: Record<string, unknown>) {
    const index = this.getIndex(indexName);
    if (!index) return;
    await this.withRetry(() => index.updateSettings(settings), `settings:${indexName}`);
  }

  getClient(): MeiliSearch | null {
    return this.client;
  }

  private bumpMeta(indexName: SearchIndexName, count: number) {
    const meta = this.indexMeta.get(indexName);
    if (meta) {
      meta.documentCount += count;
      meta.lastSyncedAt = new Date().toISOString();
      meta.updatedAt = new Date().toISOString();
    }
  }

  private resolveMeiliSort(sort?: ListingSortOption): string[] | undefined {
    switch (sort) {
      case 'price_low_to_high':
        return ['price:asc'];
      case 'price_high_to_low':
        return ['price:desc'];
      case 'newest':
        return ['isBoosted:desc', 'boostedUntil:desc', 'createdAt:desc'];
      case 'nearest':
        return undefined;
      default:
        return ['isBoosted:desc', 'boostedUntil:desc', 'createdAt:desc'];
    }
  }

  private getIndex(indexName: SearchIndexName): Index | null {
    if (!this.client) return null;
    return this.client.index(indexName);
  }

  private async tryConnect(logOnFailure: boolean): Promise<boolean> {
    const host = process.env.MEILISEARCH_HOST ?? 'http://localhost:7700';
    const apiKey = process.env.MEILISEARCH_API_KEY || 'dev-master-key';

    try {
      const client = new MeiliSearch({ host, apiKey });
      await client.health();
      this.client = client;
      await this.applyIndexSettings();
      this.logger.log('MeilisearchService', `Connected to Meilisearch at ${host}`);
      return true;
    } catch {
      this.client = null;
      for (const meta of this.indexMeta.values()) {
        meta.isHealthy = false;
      }
      if (logOnFailure && !this.connectFailureLogged) {
        this.connectFailureLogged = true;
        this.logger.log('MeilisearchService', 'Meilisearch unavailable — search will use database fallback');
      }
      return false;
    }
  }

  private seedIndexMeta() {
    const indexes: SearchIndexName[] = ['listings', 'users', 'categories', 'chat_threads'];
    for (const name of indexes) {
      const now = new Date().toISOString();
      this.indexMeta.set(name, {
        id: `idx-${name}`,
        indexName: name,
        type: name,
        documentCount: 0,
        isHealthy: false,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  private async applyIndexSettings() {
    if (!this.client) return;

    for (const meta of this.indexMeta.values()) {
      meta.isHealthy = true;
    }

    await this.client.index('listings').updateSettings({
      searchableAttributes: [
        'title',
        'description',
        'locationLabel',
        'categorySlug',
        'categoryName',
        'sellerName',
      ],
      filterableAttributes: [
        'status',
        'sellerStatus',
        'categoryId',
        'condition',
        'price',
        'createdAt',
        'isBoosted',
        '_geo',
      ],
      sortableAttributes: ['price', 'createdAt', 'favoriteCount', 'boostedUntil', 'isBoosted'],
    });

    await this.client.index('users').updateSettings({
      searchableAttributes: ['displayName'],
      filterableAttributes: ['status', 'role', 'sellerVerified'],
    });

    await this.client.index('categories').updateSettings({
      searchableAttributes: ['name', 'slug'],
      filterableAttributes: ['isActive', 'isHidden', 'parentId'],
    });

    await this.client.index('chat_threads').updateSettings({
      searchableAttributes: ['listingTitle', 'id'],
      filterableAttributes: ['buyerId', 'sellerId', 'listingId'],
    });
  }
}
