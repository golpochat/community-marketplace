import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { afterEach, describe, expect, it } from 'vitest';

import { MetricsScrapeGuard } from '../src/modules/metrics/metrics-scrape.guard';

const TOKEN = 'dev-metrics-scrape-token';

function contextWith(headers: Record<string, string | undefined>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as ExecutionContext;
}

describe('MetricsScrapeGuard', () => {
  const previous = process.env.METRICS_SCRAPE_TOKEN;
  const guard = new MetricsScrapeGuard();

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.METRICS_SCRAPE_TOKEN;
    } else {
      process.env.METRICS_SCRAPE_TOKEN = previous;
    }
  });

  it('rejects scrape requests when the token is not configured', () => {
    delete process.env.METRICS_SCRAPE_TOKEN;
    expect(() => guard.canActivate(contextWith({}))).toThrow(UnauthorizedException);
  });

  it('rejects missing or mismatched tokens', () => {
    process.env.METRICS_SCRAPE_TOKEN = TOKEN;
    expect(() => guard.canActivate(contextWith({}))).toThrow(UnauthorizedException);
    expect(() =>
      guard.canActivate(contextWith({ authorization: 'Bearer wrong-metrics-token' })),
    ).toThrow(UnauthorizedException);
  });

  it('accepts a matching bearer or X-Metrics-Token header', () => {
    process.env.METRICS_SCRAPE_TOKEN = TOKEN;
    expect(guard.canActivate(contextWith({ authorization: `Bearer ${TOKEN}` }))).toBe(true);
    expect(guard.canActivate(contextWith({ 'x-metrics-token': TOKEN }))).toBe(true);
  });
});
