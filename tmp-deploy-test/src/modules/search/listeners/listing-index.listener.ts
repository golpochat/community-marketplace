import { Injectable, OnModuleInit } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { SearchIndexingService } from '../services/search-indexing.service';
import { MeilisearchService } from '../services/meilisearch.service';

@Injectable()
export class ListingIndexListener implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly indexing: SearchIndexingService,
    private readonly meili: MeilisearchService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('listing.created', (event) => {
      void this.indexing.indexListing(event.payload.listingId as string);
    });
    this.eventBus.subscribe('listing.updated', (event) => {
      void this.indexing.indexListing(event.payload.listingId as string);
    });
    this.eventBus.subscribe('listing.deleted', (event) => {
      void this.meili.deleteDocument('listings', event.payload.listingId as string);
    });
  }
}
