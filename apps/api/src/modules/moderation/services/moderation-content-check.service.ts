import { Injectable } from '@nestjs/common';

import type { ModerationReportReason } from '@community-marketplace/types';

export interface ContentCheckResult {
  flagged: boolean;
  reasons: string[];
  autoFlag: boolean;
  autoHide: boolean;
  aiScore?: number;
}

const PROFANITY_PATTERNS = [
  /\b(f+u+c+k+|sh+i+t+|a+s+s+h+o+l+e+)\b/i,
  /\b(b+i+t+c+h+)\b/i,
];

const SCAM_KEYWORDS = [
  'wire transfer',
  'western union',
  'gift card',
  'crypto only',
  'send money first',
  'overseas shipping only',
  'whatsapp only',
  'telegram only',
  'verify account',
  'click this link',
];

const SUSPICIOUS_PRICE_RATIO = 0.15;

@Injectable()
export class ModerationContentCheckService {
  /** Stub for external AI moderation API integration. */
  async checkWithAi(content: string): Promise<{ flagged: boolean; score: number; categories: string[] }> {
    const lower = content.toLowerCase();
    const toxicHints = ['scam', 'fraud', 'fake', 'stolen'];
    const hits = toxicHints.filter((w) => lower.includes(w));
    return {
      flagged: hits.length >= 2,
      score: Math.min(hits.length * 0.35, 1),
      categories: hits,
    };
  }

  checkText(content: string): ContentCheckResult {
    const reasons: string[] = [];
    let flagged = false;

    for (const pattern of PROFANITY_PATTERNS) {
      if (pattern.test(content)) {
        reasons.push('profanity');
        flagged = true;
        break;
      }
    }

    const lower = content.toLowerCase();
    const scamHits = SCAM_KEYWORDS.filter((kw) => lower.includes(kw));
    if (scamHits.length > 0) {
      reasons.push('scam_keywords');
      flagged = true;
    }

    return {
      flagged,
      reasons,
      autoFlag: flagged,
      autoHide: scamHits.length >= 2,
    };
  }

  checkListingPrice(price: number, categoryAvgPrice?: number): ContentCheckResult {
    if (!categoryAvgPrice || categoryAvgPrice <= 0) {
      return { flagged: false, reasons: [], autoFlag: false, autoHide: false };
    }

    const ratio = price / categoryAvgPrice;
    if (ratio < SUSPICIOUS_PRICE_RATIO) {
      return {
        flagged: true,
        reasons: ['suspicious_pricing'],
        autoFlag: true,
        autoHide: ratio < 0.05,
      };
    }

    return { flagged: false, reasons: [], autoFlag: false, autoHide: false };
  }

  async checkRepeatedReports(
    count: number,
    threshold = 3,
  ): Promise<ContentCheckResult> {
    if (count >= threshold) {
      return {
        flagged: true,
        reasons: ['repeated_reports'],
        autoFlag: true,
        autoHide: count >= threshold + 2,
      };
    }
    return { flagged: false, reasons: [], autoFlag: false, autoHide: false };
  }

  async runFullCheck(input: {
    text?: string;
    price?: number;
    categoryAvgPrice?: number;
    repeatedReportCount?: number;
    reason?: ModerationReportReason;
  }): Promise<ContentCheckResult> {
    const merged: ContentCheckResult = {
      flagged: false,
      reasons: [],
      autoFlag: false,
      autoHide: false,
    };

    if (input.text) {
      const textResult = this.checkText(input.text);
      this.mergeResults(merged, textResult);

      const aiResult = await this.checkWithAi(input.text);
      if (aiResult.flagged) {
        merged.flagged = true;
        merged.reasons.push('ai_moderation');
        merged.autoFlag = true;
        merged.aiScore = aiResult.score;
      }
    }

    if (input.price !== undefined) {
      const priceResult = this.checkListingPrice(input.price, input.categoryAvgPrice);
      this.mergeResults(merged, priceResult);
    }

    if (input.repeatedReportCount !== undefined) {
      const repeatResult = await this.checkRepeatedReports(input.repeatedReportCount);
      this.mergeResults(merged, repeatResult);
    }

    if (input.reason === 'scams' || input.reason === 'fraud' || input.reason === 'fake_listing') {
      merged.autoFlag = true;
      merged.flagged = true;
      if (!merged.reasons.includes('report_reason')) {
        merged.reasons.push('report_reason');
      }
    }

    return merged;
  }

  private mergeResults(target: ContentCheckResult, source: ContentCheckResult) {
    if (source.flagged) target.flagged = true;
    target.reasons.push(...source.reasons);
    if (source.autoFlag) target.autoFlag = true;
    if (source.autoHide) target.autoHide = true;
    if (source.aiScore !== undefined) target.aiScore = source.aiScore;
  }
}
