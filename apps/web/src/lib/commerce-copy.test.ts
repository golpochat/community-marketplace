import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  FORBIDDEN_PUBLIC_CLAIM_PATTERNS,
  formatSellerFeeDisclosure,
  resolveSellerPlatformFee,
  shouldNudgeSellerConnect,
  classifySaleCloseChannel,
  summarizeSaleCloseEvents,
} from '@community-marketplace/utils';
import { markListingSoldSchema } from '@community-marketplace/validation';

const WEB_SRC = path.resolve(__dirname, '..');

const PUBLIC_COPY_ROOTS = [
  path.join(WEB_SRC, 'lib', 'seo'),
  path.join(WEB_SRC, 'components', 'public'),
  path.join(WEB_SRC, 'components', 'listings', 'listing-trust-cues.tsx'),
  path.join(WEB_SRC, 'app', '(site)'),
];

function collectSourceFiles(target: string): string[] {
  if (!existsSync(target)) return [];
  if (statSync(target).isFile()) {
    return target.endsWith('.ts') || target.endsWith('.tsx') ? [target] : [];
  }
  const files: string[] = [];
  for (const entry of readdirSync(target)) {
    files.push(...collectSourceFiles(path.join(target, entry)));
  }
  return files;
}

describe('commerce public copy', () => {
  it('does not claim the marketplace is commission-free', () => {
    const files = PUBLIC_COPY_ROOTS.flatMap(collectSourceFiles);
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const pattern of FORBIDDEN_PUBLIC_CLAIM_PATTERNS) {
        if (pattern.test(text)) {
          hits.push(`${path.relative(WEB_SRC, file)} matches ${pattern}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it('does not label meetup safety as Buyer protection', () => {
    const files = [
      path.join(WEB_SRC, 'components', 'public', 'hero-section.tsx'),
      path.join(WEB_SRC, 'components', 'listings', 'listing-trust-cues.tsx'),
    ];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      expect(text).not.toMatch(/Buyer protection/);
    }
  });
});

describe('resolveSellerPlatformFee', () => {
  it('uses the verified rate when a verified seller has no custom override', () => {
    const info = resolveSellerPlatformFee({
      sellerStatus: 'verified',
      customPlatformFeePercent: null,
      defaultPlatformFeePercent: 10,
      verifiedSellerFeePercent: 8,
    });
    expect(info.effectiveFeePercent).toBe(8);
    expect(info.isVerifiedRate).toBe(true);
    expect(info.isCustomOverride).toBe(false);
  });

  it('keeps a true custom override', () => {
    const info = resolveSellerPlatformFee({
      sellerStatus: 'verified',
      customPlatformFeePercent: 5,
      defaultPlatformFeePercent: 10,
      verifiedSellerFeePercent: 8,
    });
    expect(info.effectiveFeePercent).toBe(5);
    expect(info.isCustomOverride).toBe(true);
    expect(info.isVerifiedRate).toBe(false);
  });

  it('treats a stored verified rate as policy, not a custom override', () => {
    const info = resolveSellerPlatformFee({
      sellerStatus: 'verified',
      customPlatformFeePercent: 8,
      defaultPlatformFeePercent: 10,
      verifiedSellerFeePercent: 8,
    });
    expect(info.effectiveFeePercent).toBe(8);
    expect(info.isCustomOverride).toBe(false);
    expect(info.isVerifiedRate).toBe(true);
  });

  it('formats seller disclosure from live rates', () => {
    expect(
      formatSellerFeeDisclosure({
        effectiveFeePercent: 8,
        isCustomOverride: false,
        defaultFeePercent: 10,
        verifiedSellerFeePercent: 8,
        isVerifiedRate: true,
      }),
    ).toMatch(/8% on card checkout \(verified rate\)/);
  });

  it('nudges Connect only at or above the listed-price threshold', () => {
    expect(shouldNudgeSellerConnect(49.99)).toBe(false);
    expect(shouldNudgeSellerConnect(50)).toBe(true);
  });
});

describe('sale close KPI', () => {
  it('classifies card vs chat/cash vs unknown', () => {
    expect(classifySaleCloseChannel('card_on_platform')).toBe('card');
    expect(classifySaleCloseChannel('cash_collection')).toBe('leaked');
    expect(classifySaleCloseChannel('off_platform')).toBe('leaked');
    expect(classifySaleCloseChannel('other')).toBe('leaked');
    expect(classifySaleCloseChannel(undefined)).toBe('unknown');
    expect(classifySaleCloseChannel('payment')).toBe('unknown');
  });

  it('summarizes listed GMV and leak rate from close channels', () => {
    const kpi = summarizeSaleCloseEvents([
      { closeChannel: 'card_on_platform', listedPrice: 100 },
      { closeChannel: 'cash_collection', listedPrice: 40 },
      { closeChannel: 'off_platform', listedPrice: 60 },
      { listedPrice: 25 },
    ]);
    expect(kpi.soldCount).toBe(4);
    expect(kpi.cardCount).toBe(1);
    expect(kpi.cardListedGmv).toBe(100);
    expect(kpi.leakedCount).toBe(2);
    expect(kpi.leakedListedGmv).toBe(100);
    expect(kpi.unknownCount).toBe(1);
    expect(kpi.leakRate).toBe(2 / 3);
    expect(kpi.windowDays).toBe(7);
  });

  it('reports zero leak rate when nothing is classified', () => {
    expect(summarizeSaleCloseEvents([]).leakRate).toBe(0);
    expect(summarizeSaleCloseEvents([{ listedPrice: 10 }]).leakRate).toBe(0);
  });
});

describe('markListingSoldSchema', () => {
  it('requires a close channel', () => {
    expect(() => markListingSoldSchema.parse({})).toThrow();
    expect(markListingSoldSchema.parse({ closeChannel: 'cash_collection' }).closeChannel).toBe(
      'cash_collection',
    );
  });
});
