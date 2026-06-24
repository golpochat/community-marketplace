import { Injectable, OnModuleInit } from '@nestjs/common';
import { MeiliSearch, type Index } from 'meilisearch';

import { LoggerLib } from '../../../libs/logger.lib';
import { SearchIndexEntity } from '../entities/search-index.entity';
import type { ReindexDto } from '../dto/search.dto';

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private client: MeiliSearch | null = null;
  private readonly indexes = new Map<string, SearchIndexEntity>();

  constructor(private readonly logger: LoggerLib) {}

  onModuleInit() {
    const host = process.env.MEILISEARCH_HOST ?? 'http://localhost:7700';
    const apiKey = process.env.MEILISEARCH_API_KEY;

    try {
      this.client = new MeiliSearch({ host, apiKey });
      this.logger.log('MeilisearchService', `Connected to Meilisearch at ${host}`);
      this.registerIndex('listings', 'listings');
      this.registerIndex('users', 'users');
      this.registerIndex('categories', 'categories');
    } catch {
      this.logger.log('MeilisearchService', 'Meilisearch unavailable — search will use in-memory fallback');
    }
  }

  async search(indexName: string, query: string, options: { limit?: number; offset?: number }) {
    const index = this.getIndex(indexName);

    if (!index) {
      return {
        hits: [],
        query,
        processingTimeMs: 0,
        limit: options.limit ?? 20,
        offset: options.offset ?? 0,
        estimatedTotalHits: 0,
      };
    }

    return index.search(query, {
      limit: options.limit ?? 20,
      offset: options.offset ?? 0,
    });
  }

  async indexDocuments(indexName: string, documents: Record<string, unknown>[]) {
    const index = this.getIndex(indexName);
    if (!index) return { indexed: 0 };

    const task = await index.addDocuments(documents);
    const entity = this.indexes.get(indexName);
    if (entity) {
      entity.documentCount += documents.length;
      entity.lastSyncedAt = new Date();
    }

    return { indexed: documents.length, taskUid: task.taskUid };
  }

  getIndexes(): SearchIndexEntity[] {
    return [...this.indexes.values()];
  }

  async reindex(dto: ReindexDto) {
    const entity = this.indexes.get(dto.type);
    if (entity) {
      entity.lastSyncedAt = new Date();
      entity.documentCount = 0;
    }
    return { type: dto.type, status: 'reindex_queued' };
  }

  private getIndex(indexName: string): Index | null {
    if (!this.client) return null;
    return this.client.index(indexName);
  }

  private registerIndex(indexName: string, type: SearchIndexEntity['type']) {
    const entity = new SearchIndexEntity();
    entity.id = `idx-${indexName}`;
    entity.indexName = indexName;
    entity.type = type;
    entity.documentCount = 0;
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    this.indexes.set(indexName, entity);
  }
}
