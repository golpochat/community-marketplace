import { Injectable, OnModuleInit } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { SearchIndexingService } from '../services/search-indexing.service';

@Injectable()
export class ChatThreadIndexListener implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly indexing: SearchIndexingService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('chat.thread_created', (event) => {
      void this.indexing.indexChatThread(event.payload.threadId as string);
    });
    this.eventBus.subscribe('chat.message_sent', (event) => {
      void this.indexing.indexChatThread(event.payload.threadId as string);
    });
  }
}
