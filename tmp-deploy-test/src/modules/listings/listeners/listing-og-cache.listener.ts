import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EventBusService } from '../../../events/event-bus.service';
import { LoggerLib } from '../../../libs/logger.lib';

@Injectable()
export class ListingOgCacheListener implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly config: ConfigService,
    private readonly logger: LoggerLib,
  ) {}

  onModuleInit() {
    const events = [
      'listing.updated',
      'listing.approved',
      'delivery.change_approved',
      'pricing.change_approved',
    ] as const;

    for (const type of events) {
      this.eventBus.subscribe(type, (event) => {
        const listingId = event.payload.listingId as string | undefined;
        if (listingId) void this.revalidateListing(listingId);
      });
    }
  }

  private async revalidateListing(listingId: string) {
    const webAppUrl = this.config.get<string>('WEB_APP_URL');
    const secret = this.config.get<string>('REVALIDATE_SECRET');
    if (!webAppUrl || !secret) return;

    const url = `${webAppUrl.replace(/\/$/, '')}/api/revalidate/listing/${listingId}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'x-revalidate-secret': secret },
      });
      if (!response.ok) {
        this.logger.warn('ListingOgCacheListener', 'OG cache revalidation failed', {
          listingId,
          status: response.status,
        });
      }
    } catch (err) {
      this.logger.warn('ListingOgCacheListener', 'OG cache revalidation error', {
        listingId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
