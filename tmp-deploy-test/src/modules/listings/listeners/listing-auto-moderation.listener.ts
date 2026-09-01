import { Injectable, OnModuleInit } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { ListingAutoModerationService } from '../services/listing-auto-moderation.service';

@Injectable()
export class ListingAutoModerationListener implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly autoModeration: ListingAutoModerationService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('moderation.report_created', (event) => {
      const payload = event.payload as {
        listingId?: string;
        targetType: string;
        reasons?: string[];
      };
      if (payload.targetType !== 'listing' || !payload.listingId) return;
      void this.autoModeration.onListingReported(
        payload.listingId,
        payload.reasons?.length ? payload.reasons : ['user_report'],
      );
    });

    this.eventBus.subscribe('seller.suspended', (event) => {
      const { sellerId } = event.payload as { sellerId: string };
      void this.autoModeration.onSellerSuspended(sellerId);
    });
  }
}
