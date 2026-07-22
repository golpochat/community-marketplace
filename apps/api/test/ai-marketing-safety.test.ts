import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { AI_MARKETING_LISTING_DAILY_GENERATION_LIMIT } from '@community-marketplace/types';

import { computeAiBilling } from '../src/modules/ai-marketing/lib/ai-billing.lib';
import { scrubPii } from '../src/modules/ai-marketing/lib/ai-pii.lib';
import { AiSafetyFilterService } from '../src/modules/ai-marketing/services/ai-safety-filter.service';
import type { AiListingContext } from '../src/modules/ai-marketing/services/ai-context-assembler.service';

function baseContext(
  overrides: Partial<AiListingContext> = {},
): AiListingContext {
  return {
    title: 'Road bike',
    description: 'Lightly used adult road bike',
    categoryName: 'Sports',
    condition: 'good',
    location: 'Dublin',
    priceLabel: '€250.00',
    ...overrides,
  };
}

describe('scrubPii', () => {
  it('redacts emails', () => {
    expect(scrubPii('Contact me at seller@example.com please')).toContain(
      '[email redacted]',
    );
    expect(scrubPii('Contact me at seller@example.com please')).not.toContain(
      'seller@example.com',
    );
  });

  it('redacts Irish mobile numbers', () => {
    const scrubbed = scrubPii('Call 087 123 4567 for collection');
    expect(scrubbed).toContain('[phone redacted]');
    expect(scrubbed).not.toContain('087');
  });

  it('redacts +353 numbers', () => {
    const scrubbed = scrubPii('WhatsApp +353 87 123 4567');
    expect(scrubbed).toContain('[phone redacted]');
  });

  it('redacts PPS-like tokens', () => {
    const scrubbed = scrubPii('PPS 1234567T on request');
    expect(scrubbed).toContain('[pps redacted]');
    expect(scrubbed).not.toContain('1234567T');
  });

  it('leaves benign listing copy intact', () => {
    const text = 'Blue piggy bank, excellent condition, Dublin 8';
    expect(scrubPii(text)).toBe(text);
  });
});

describe('AiSafetyFilterService', () => {
  const safety = new AiSafetyFilterService();

  it('allows ordinary marketplace listings', () => {
    expect(() => safety.assertSafeContext(baseContext())).not.toThrow();
    expect(() =>
      safety.assertSafeOutput('Great condition road bike, collection in Dublin.'),
    ).not.toThrow();
  });

  it('does not block piggy bank as pork', () => {
    expect(() =>
      safety.assertSafeContext(
        baseContext({ title: 'Ceramic piggy bank', description: 'Cute saver' }),
      ),
    ).not.toThrow();
  });

  it('blocks alcohol and pork product context', () => {
    expect(() =>
      safety.assertSafeContext(
        baseContext({ title: 'Case of beer', description: 'Lager cans' }),
      ),
    ).toThrow(BadRequestException);

    expect(() =>
      safety.assertSafeContext(
        baseContext({ title: 'Smoked bacon', description: 'Vacuum packed' }),
      ),
    ).toThrow(BadRequestException);
  });

  it('blocks weapons and counterfeit output', () => {
    expect(() =>
      safety.assertSafeOutput('This replica handbag looks identical to the brand.'),
    ).toThrow(BadRequestException);
    expect(() =>
      safety.assertSafeContext(
        baseContext({ title: 'Antique firearm for sale' }),
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects empty AI output', () => {
    expect(() => safety.assertSafeOutput('   ')).toThrow(BadRequestException);
  });

  it('prepareContextForProvider scrubs PII fields', () => {
    const prepared = safety.prepareContextForProvider(
      baseContext({
        title: 'Bike — email me at sell@test.ie',
        description: 'Ring 086 111 2222',
        location: 'Cork, +353 21 123 4567',
      }),
    );
    expect(prepared.title).toContain('[email redacted]');
    expect(prepared.description).toContain('[phone redacted]');
    expect(prepared.location).toContain('[phone redacted]');
  });
});

describe('computeAiBilling', () => {
  it('uses free quota when enough units remain', () => {
    expect(
      computeAiBilling({
        sellerVerified: true,
        freeUnitsUsedThisMonth: 0,
        creditUnits: 2,
        freeUnitsMonthly: 10,
      }),
    ).toEqual({
      billingMethod: 'free_quota',
      amountEur: 0,
      freeUnitsRemainingBefore: 10,
    });
  });

  it('charges wallet when free units are exhausted', () => {
    expect(
      computeAiBilling({
        sellerVerified: true,
        freeUnitsUsedThisMonth: 10,
        creditUnits: 2,
        freeUnitsMonthly: 10,
      }),
    ).toEqual({
      billingMethod: 'wallet',
      amountEur: 0.1,
      freeUnitsRemainingBefore: 0,
    });
  });

  it('charges wallet when effective free units are 0', () => {
    expect(
      computeAiBilling({
        sellerVerified: false,
        freeUnitsUsedThisMonth: 0,
        creditUnits: 5,
        freeUnitsMonthly: 0,
      }),
    ).toEqual({
      billingMethod: 'wallet',
      amountEur: 0.25,
      freeUnitsRemainingBefore: 0,
    });
  });

  it('honours an override allowance even when sellerVerified is false', () => {
    expect(
      computeAiBilling({
        sellerVerified: false,
        freeUnitsUsedThisMonth: 0,
        creditUnits: 2,
        freeUnitsMonthly: 20,
      }),
    ).toEqual({
      billingMethod: 'free_quota',
      amountEur: 0,
      freeUnitsRemainingBefore: 20,
    });
  });
});

describe('listing daily generation limit', () => {
  it('caps at 15 generations per listing per day', () => {
    expect(AI_MARKETING_LISTING_DAILY_GENERATION_LIMIT).toBe(15);
  });
});

describe('resolveLiveTextProviders', () => {
  it('orders OpenAI before Anthropic when both keys are set', async () => {
    const { resolveLiveTextProviders } = await import(
      '../src/modules/ai-marketing/services/ai-provider.service'
    );
    const providers = resolveLiveTextProviders({
      OPENAI_API_KEY: 'sk-test',
      OPENAI_CHAT_MODEL: 'gpt-4o-mini',
      ANTHROPIC_API_KEY: 'ant-test',
      ANTHROPIC_CHAT_MODEL: 'claude-haiku-4-5',
    } as NodeJS.ProcessEnv);
    expect(providers.map((p) => p.id)).toEqual(['openai', 'anthropic']);
    expect(providers[0]?.model).toBe('gpt-4o-mini');
    expect(providers[1]?.model).toBe('claude-haiku-4-5');
  });

  it('allows Anthropic-only chain', async () => {
    const { resolveLiveTextProviders } = await import(
      '../src/modules/ai-marketing/services/ai-provider.service'
    );
    const providers = resolveLiveTextProviders({
      ANTHROPIC_API_KEY: 'ant-test',
    } as NodeJS.ProcessEnv);
    expect(providers.map((p) => p.id)).toEqual(['anthropic']);
  });

  it('returns empty when no live keys are set', async () => {
    const { resolveLiveTextProviders } = await import(
      '../src/modules/ai-marketing/services/ai-provider.service'
    );
    expect(resolveLiveTextProviders({} as NodeJS.ProcessEnv)).toEqual([]);
  });
});
