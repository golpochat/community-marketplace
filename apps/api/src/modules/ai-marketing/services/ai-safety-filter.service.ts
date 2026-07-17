import { BadRequestException, Injectable } from '@nestjs/common';

import { scrubPii } from '../lib/ai-pii.lib';
import type { AiListingContext } from './ai-context-assembler.service';

/**
 * Conservative prohibited-content patterns aligned with marketplace policy.
 * Avoids benign false positives (e.g. "piggy bank") by using specific product terms.
 */
export const AI_MARKETING_BLOCKED_PATTERNS: RegExp[] = [
  // Financial / scam claims
  /\bguaranteed\s+profit\b/i,
  /\bget\s+rich\b/i,
  /\bwire\s+transfer\b/i,
  /\bwestern\s+union\b/i,
  /\bgift\s+cards?\s+only\b/i,
  /\bcrypto\s+only\b/i,
  /\bwhatsapp\s+only\b/i,
  /\btelegram\s+only\b/i,

  // Counterfeit
  /\bcounterfeit\b/i,
  /\breplica\b/i,
  /\bfake\s+id\b/i,

  // Weapons / ammo
  /\bweapons?\b/i,
  /\bammunition\b/i,
  /\bfirearms?\b/i,
  /\bhandguns?\b/i,

  // Drugs / vapes
  /\billegal\s+drugs?\b/i,
  /\bcocaine\b/i,
  /\bheroin\b/i,
  /\bmdma\b/i,
  /\becstasy\b/i,
  /\bcannabis\b/i,
  /\bmarijuana\b/i,
  /\bvape\s+juice\b/i,
  /\be-?cigarettes?\b/i,
  /\bnicotine\s+pouches?\b/i,

  // Alcohol (explicit product terms)
  /\balcoholic\b/i,
  /\balcohol\b/i,
  /\bbeers?\b/i,
  /\bwines?\b/i,
  /\bvodka\b/i,
  /\bwhiskey\b/i,
  /\bwhisky\b/i,
  /\bgin\b/i,
  /\brum\b/i,
  /\btequila\b/i,
  /\bcider\b/i,
  /\blager\b/i,
  /\bstout\b/i,
  /\bspirits\b/i,
  /\bliquor\b/i,
  /\bmoonshine\b/i,
  /\bhomebrew\s+kit\b/i,
  /\bbrewery\s+kit\b/i,

  // Pork products (not "piggy")
  /\bpork\b/i,
  /\bbacon\b/i,
  /\bham\b/i,
  /\blard\b/i,
  /\bgammon\b/i,
  /\bpork\s+sausages?\b/i,

  // Adult / gambling
  /\badult\s+(toy|content|video|dvd|magazine)s?\b/i,
  /\bporn(ography)?\b/i,
  /\bsex\s+toy\b/i,
  /\bgambling\b/i,
  /\bcasino\s+chips?\b/i,
  /\blottery\s+tickets?\b/i,
];

@Injectable()
export class AiSafetyFilterService {
  assertSafeContext(context: AiListingContext): void {
    const blob = [context.title, context.description, context.categoryName]
      .filter(Boolean)
      .join(' ');
    this.assertSafeText(blob, 'listing context');
  }

  assertSafeOutput(text: string): void {
    if (!text.trim()) {
      throw new BadRequestException('AI returned empty text. Please try again.');
    }
    this.assertSafeText(text, 'AI output');
  }

  /** Scrub PII from listing fields before provider prompts and audit summaries. */
  prepareContextForProvider(context: AiListingContext): AiListingContext {
    return {
      ...context,
      title: scrubPii(context.title),
      description: scrubPii(context.description),
      location: scrubPii(context.location),
      storeName: context.storeName ? scrubPii(context.storeName) : context.storeName,
    };
  }

  private assertSafeText(text: string, label: string): void {
    for (const pattern of AI_MARKETING_BLOCKED_PATTERNS) {
      if (pattern.test(text)) {
        throw new BadRequestException(
          `Blocked ${label}: content may violate marketplace policies. Please edit and try again.`,
        );
      }
    }
  }
}
