import { Injectable } from '@nestjs/common';

import type { GlobalSearchResults } from '@community-marketplace/types';
import type { GlobalSearchQueryInput } from '@community-marketplace/validation';

import { MeilisearchService } from './meilisearch.service';

@Injectable()
export class SearchGlobalService {
  constructor(private readonly meili: MeilisearchService) {}

  async search(input: GlobalSearchQueryInput, isAdmin = false): Promise<GlobalSearchResults> {
    const start = Date.now();
    const includeRestricted = isAdmin && input.includeRestricted;
    const limit = input.limit;

    const listingFilter = includeRestricted
      ? undefined
      : { filter: 'status = active AND sellerStatus = active' };

    const [listingsResult, categoriesResult, usersResult] = await Promise.all([
      this.meili.search('listings', input.q, {
        limit,
        ...(listingFilter ?? {}),
      }),
      this.meili.search('categories', input.q, {
        limit: Math.ceil(limit / 2),
        filter: includeRestricted ? undefined : 'isActive = true',
      }),
      this.meili.search('users', input.q, {
        limit: Math.ceil(limit / 2),
        filter: includeRestricted ? 'role = SELLER' : 'role = SELLER AND status = active',
      }),
    ]);

    return {
      query: input.q,
      processingTimeMs: Date.now() - start,
      listings: (listingsResult.hits as Record<string, unknown>[]).map((doc, i) => ({
        document: doc as unknown as GlobalSearchResults['listings'][0]['document'],
        score: (listingsResult.hits.length - i) * 3,
      })),
      categories: (categoriesResult.hits as Record<string, unknown>[]).map((doc, i) => ({
        document: doc as unknown as GlobalSearchResults['categories'][0]['document'],
        score: (categoriesResult.hits.length - i) * 2,
      })),
      sellers: (usersResult.hits as Record<string, unknown>[]).map((doc, i) => ({
        document: doc as unknown as GlobalSearchResults['sellers'][0]['document'],
        score: usersResult.hits.length - i,
      })),
    };
  }
}
