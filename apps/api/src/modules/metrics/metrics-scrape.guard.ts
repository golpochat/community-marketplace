import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

import { loadApiEnv } from '@community-marketplace/config';

function tokensEqual(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

@Injectable()
export class MetricsScrapeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = loadApiEnv().METRICS_SCRAPE_TOKEN;
    if (!expected) {
      throw new UnauthorizedException('Metrics scrape token is not configured');
    }

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string; 'x-metrics-token'?: string };
    }>();

    const headerToken = request.headers['x-metrics-token'];
    const bearer = request.headers.authorization?.startsWith('Bearer ')
      ? request.headers.authorization.slice('Bearer '.length)
      : undefined;
    const provided = headerToken || bearer;

    if (!provided || !tokensEqual(provided, expected)) {
      throw new UnauthorizedException('Invalid metrics scrape token');
    }

    return true;
  }
}
