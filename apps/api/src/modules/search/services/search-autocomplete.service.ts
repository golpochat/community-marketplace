import { Injectable } from '@nestjs/common';

import type { AutocompleteSuggestion } from '@community-marketplace/types';
import type { AutocompleteQueryInput } from '@community-marketplace/validation';

import { RedisCacheService } from '../../../libs/redis-cache.service';
import { MeilisearchService } from './meilisearch.service';

@Injectable()
export class SearchAutocompleteService {
  constructor(
    private readonly meili: MeilisearchService,
    private readonly cache: RedisCacheService,
  ) {}

  async suggest(input: AutocompleteQueryInput): Promise<AutocompleteSuggestion[]> {
    const cacheKey = `search:autocomplete:${input.q}:${input.types.join(',')}:${input.limit}`;
    const cached = await this.cache.get<AutocompleteSuggestion[]>(cacheKey);
    if (cached) return cached;

    const suggestions: AutocompleteSuggestion[] = [];
    const types = new Set(input.types);

    if (types.has('listing')) {
      const result = await this.meili.autocomplete('listings', input.q, input.limit);
      for (const hit of result.hits as Array<Record<string, unknown>>) {
        suggestions.push({
          type: 'listing',
          id: String(hit.id),
          label: String(hit.title ?? ''),
          meta: { price: hit.price, imageUrl: hit.imageUrl },
        });
      }
    }

    if (types.has('category')) {
      const result = await this.meili.autocomplete('categories', input.q, input.limit);
      for (const hit of result.hits as Array<Record<string, unknown>>) {
        suggestions.push({
          type: 'category',
          id: String(hit.id),
          label: String(hit.name ?? ''),
          meta: { slug: hit.slug },
        });
      }
    }

    if (types.has('seller')) {
      const result = await this.meili.autocomplete('users', input.q, input.limit);
      for (const hit of result.hits as Array<Record<string, unknown>>) {
        if (hit.role !== 'SELLER') continue;
        suggestions.push({
          type: 'seller',
          id: String(hit.id),
          label: String(hit.displayName ?? ''),
          meta: { verified: hit.sellerVerified },
        });
      }
    }

    const trimmed = suggestions.slice(0, input.limit);
    await this.cache.set(cacheKey, trimmed, 120);
    return trimmed;
  }
}
