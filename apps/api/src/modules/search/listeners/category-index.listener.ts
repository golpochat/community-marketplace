import { Injectable, OnModuleInit } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { SearchIndexingService } from '../services/search-indexing.service';

@Injectable()
export class CategoryIndexListener implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly indexing: SearchIndexingService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('category.created', (event) => {
      void this.indexing.indexCategory(event.payload.categoryId as string);
    });
    this.eventBus.subscribe('category.updated', (event) => {
      void this.indexing.indexCategory(event.payload.categoryId as string);
    });
  }
}
