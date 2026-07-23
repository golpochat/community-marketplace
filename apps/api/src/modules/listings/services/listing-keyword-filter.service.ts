import { BadRequestException, Injectable } from '@nestjs/common';

import type { KeywordMatchResult } from '@community-marketplace/types';
import {
  matchKeywordFilters,
  parseKeywordFilters,
} from '@community-marketplace/utils';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ListingKeywordFilterService {
  constructor(private readonly prisma: PrismaService) {}

  async getMatch(title: string, description: string): Promise<KeywordMatchResult | null> {
    const config = await this.loadConfig();
    if (!config.enabled) return null;
    return matchKeywordFilters(`${title}\n${description}`, config);
  }

  /**
   * When filters are enabled, hard matches throw HTTP 400.
   * Returns the match result (including soft) for callers to queue review.
   */
  async assertNotHardBlocked(
    title: string,
    description: string,
  ): Promise<KeywordMatchResult | null> {
    const match = await this.getMatch(title, description);
    if (!match) return null;
    if (match.tier === 'hard') {
      throw new BadRequestException(this.formatHardMessage(match));
    }
    return match;
  }

  formatSoftReasons(match: KeywordMatchResult | null): string[] {
    if (!match || match.tier !== 'soft' || match.softMatches.length === 0) return [];
    return [
      `Restricted content pending review: ${match.softMatches.slice(0, 8).join(', ')}`,
    ];
  }

  private formatHardMessage(match: KeywordMatchResult): string {
    const samples = match.hardMatches
      .slice(0, 5)
      .map((m) => `${m.term} (${m.category})`)
      .join(', ');
    return (
      `This item isn’t allowed on SellNearby. Matched prohibited terms: ${samples}. ` +
      `Please review our Prohibited Items Policy and remove those details before saving.`
    );
  }

  private async loadConfig() {
    const row = await this.prisma.platformSettings.findUnique({
      where: { id: 'default' },
      select: { keywordFilters: true },
    });
    return parseKeywordFilters(row?.keywordFilters ?? null);
  }
}
