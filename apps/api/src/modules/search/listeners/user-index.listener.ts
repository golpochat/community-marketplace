import { Injectable, OnModuleInit } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { SearchIndexingService } from '../services/search-indexing.service';

@Injectable()
export class UserIndexListener implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly indexing: SearchIndexingService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('user.verification_approved', (event) => {
      void this.indexing.indexUser(event.payload.userId as string);
    });
    this.eventBus.subscribe('user.verification_rejected', (event) => {
      void this.indexing.indexUser(event.payload.userId as string);
    });
    this.eventBus.subscribe('user.profile_updated', (event) => {
      void this.indexing.indexUser(event.payload.userId as string);
    });
  }
}
