import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import type { ReindexInput } from '@community-marketplace/validation';
import type { ReindexJobStatus, SearchIndexName } from '@community-marketplace/types';

import { JobQueueService } from '../../../jobs/job-queue.service';
import { PrismaService } from '../../../database/prisma.service';
import { LoggerLib } from '../../../libs/logger.lib';
import {
  toMeiliCategoryDocument,
  toMeiliChatThreadDocument,
  toMeiliUserDocument,
} from '../mappers/search.mapper';
import { listingInclude, toMeiliDocument } from '../../listings/mappers/listing.mapper';
import { SearchSemanticService } from './search-semantic.service';
import { MeilisearchService } from './meilisearch.service';

@Injectable()
export class SearchIndexingService implements OnModuleInit, OnModuleDestroy {
  private readonly jobStatuses = new Map<SearchIndexName, ReindexJobStatus>();
  private nightlyTimer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly meili: MeilisearchService,
    private readonly semantic: SearchSemanticService,
    private readonly jobs: JobQueueService,
    private readonly logger: LoggerLib,
  ) {}

  onModuleInit() {
    this.jobs.registerHandler('search.reindex', async (payload) => {
      const type = payload.type as SearchIndexName | undefined;
      if (!type) return;
      await this.runReindex(type);
    });

    this.jobs.registerHandler('search.nightly_sync', async () => {
      await this.runReindex('listings');
      await this.runReindex('users');
      await this.runReindex('categories');
    });

    this.scheduleNightlySync();
  }

  onModuleDestroy() {
    if (this.nightlyTimer) clearTimeout(this.nightlyTimer);
  }

  private scheduleNightlySync() {
    const scheduleNext = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(2, 0, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);

      this.nightlyTimer = setTimeout(() => {
        void this.jobs.enqueue({ name: 'search.nightly_sync' });
        scheduleNext();
      }, next.getTime() - now.getTime());
    };
    scheduleNext();
  }

  async queueReindex(input: ReindexInput): Promise<ReindexJobStatus> {
    const status: ReindexJobStatus = { type: input.type, status: 'queued' };
    this.jobStatuses.set(input.type, status);
    await this.jobs.enqueue({ name: 'search.reindex', payload: { type: input.type } });
    return status;
  }

  getJobStatus(type: SearchIndexName): ReindexJobStatus | undefined {
    return this.jobStatuses.get(type);
  }

  async runReindex(type: SearchIndexName): Promise<ReindexJobStatus> {
    const status: ReindexJobStatus = { type, status: 'processing' };
    this.jobStatuses.set(type, status);

    try {
      let indexed = 0;
      await this.meili.deleteAllDocuments(type);

      if (type === 'listings') {
        indexed = await this.reindexListings();
      } else if (type === 'users') {
        indexed = await this.reindexUsers();
      } else if (type === 'categories') {
        indexed = await this.reindexCategories();
      } else if (type === 'chat_threads') {
        indexed = await this.reindexChatThreads();
      }

      const done: ReindexJobStatus = { type, status: 'completed', indexed };
      this.jobStatuses.set(type, done);
      this.meili.markIndexSynced(type, indexed);
      return done;
    } catch (error) {
      const failed: ReindexJobStatus = {
        type,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Reindex failed',
      };
      this.jobStatuses.set(type, failed);
      this.logger.log('SearchIndexingService', `Reindex ${type} failed`);
      return failed;
    }
  }

  async indexListing(listingId: string) {
    const row = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: listingInclude,
    });
    if (!row) return;

    if (
      (row.status !== 'active' && row.status !== 'reserved') ||
      row.seller.status !== 'active'
    ) {
      await this.meili.deleteDocument('listings', listingId);
      return;
    }

    const embedding = await this.semantic.generateEmbedding(
      `${row.title}\n${row.description}`,
    );
    await this.meili.indexDocuments('listings', [toMeiliDocument(row, embedding)]);
  }

  async indexUser(userId: string) {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        primaryRole: true,
        verifications: { where: { badgeGranted: true, status: 'approved' }, take: 1 },
      },
    });
    if (!row || row.status !== 'active') {
      await this.meili.deleteDocument('users', userId);
      return;
    }
    await this.meili.indexDocuments('users', [toMeiliUserDocument(row)]);
  }

  async indexCategory(categoryId: string) {
    const row = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { parent: true },
    });
    if (!row || !row.isActive || row.isHidden) {
      await this.meili.deleteDocument('categories', categoryId);
      return;
    }
    await this.meili.indexDocuments('categories', [toMeiliCategoryDocument(row)]);
  }

  async indexChatThread(threadId: string) {
    const row = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
      include: { listing: { select: { title: true } } },
    });
    if (!row) {
      await this.meili.deleteDocument('chat_threads', threadId);
      return;
    }
    await this.meili.indexDocuments('chat_threads', [toMeiliChatThreadDocument(row)]);
  }

  private async reindexListings() {
    const batchSize = 100;
    let indexed = 0;
    let skip = 0;

    while (true) {
      const rows = await this.prisma.listing.findMany({
        where: {
          status: { in: ['active', 'reserved'] },
          seller: { status: 'active' },
        },
        include: listingInclude,
        skip,
        take: batchSize,
      });
      if (!rows.length) break;

      const docs = await Promise.all(
        rows.map(async (row) => {
          const embedding = await this.semantic.generateEmbedding(
            `${row.title}\n${row.description}`,
          );
          return toMeiliDocument(row, embedding);
        }),
      );
      await this.meili.indexDocuments('listings', docs);
      indexed += docs.length;
      skip += batchSize;
    }
    return indexed;
  }

  private async reindexUsers() {
    const rows = await this.prisma.user.findMany({
      where: { status: 'active' },
      include: {
        primaryRole: true,
        verifications: { where: { badgeGranted: true, status: 'approved' }, take: 1 },
      },
    });
    const docs = rows
      .filter((row) => row.primaryRole)
      .map(toMeiliUserDocument);
    await this.meili.indexDocuments('users', docs);
    return docs.length;
  }

  private async reindexCategories() {
    const rows = await this.prisma.category.findMany({
      where: { isActive: true, isHidden: false },
      include: { parent: true },
    });
    const docs = rows.map(toMeiliCategoryDocument);
    await this.meili.indexDocuments('categories', docs);
    return docs.length;
  }

  private async reindexChatThreads() {
    const rows = await this.prisma.chatThread.findMany({
      include: { listing: { select: { title: true } } },
      take: 5000,
    });
    const docs = rows.map(toMeiliChatThreadDocument);
    await this.meili.indexDocuments('chat_threads', docs);
    return docs.length;
  }
}
