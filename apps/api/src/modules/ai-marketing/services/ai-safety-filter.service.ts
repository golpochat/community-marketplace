import { BadRequestException, Injectable } from '@nestjs/common';

import type { AiListingContext } from './ai-context-assembler.service';

const BLOCKED_PATTERNS = [
  /\bguaranteed\s+profit\b/i,
  /\bget\s+rich\b/i,
  /\bcounterfeit\b/i,
  /\bfake\s+id\b/i,
  /\bweapon\b/i,
  /\bammunition\b/i,
  /\billegal\s+drugs?\b/i,
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

  private assertSafeText(text: string, label: string): void {
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(text)) {
        throw new BadRequestException(
          `Blocked ${label}: content may violate marketplace policies. Please edit and try again.`,
        );
      }
    }
  }
}
