import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { LibsModule } from '../../libs/libs.module';
import { UtilsModule } from '../../utils/utils.module';
import { AuthModule } from '../auth/auth.module';
import { SellerVerificationModule } from '../seller/seller-verification.module';
import { UsersModule } from '../users/users.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { MessagesController } from './messages.controller';
import { ChatRealtimeListener } from './listeners/chat-realtime.listener';
import { ChatAccessService } from './services/chat-access.service';
import { ChatInboxService } from './services/chat-inbox.service';
import { ChatMessagesService } from './services/chat-messages.service';
import { ChatModerationService } from './services/chat-moderation.service';
import { ChatPresenceService } from './services/chat-presence.service';
import { ChatR2StorageService } from './services/chat-r2-storage.service';
import { ChatRealtimeService } from './services/chat-realtime.service';
import { ChatSystemMessagesService } from './services/chat-system-messages.service';
import { ChatThreadsService } from './services/chat-threads.service';

@Module({
  imports: [DatabaseModule, EventsModule, LibsModule, UtilsModule, AuthModule, UsersModule, SellerVerificationModule],
  controllers: [ChatController, MessagesController],
  providers: [
    ChatService,
    ChatGateway,
    ChatThreadsService,
    ChatMessagesService,
    ChatInboxService,
    ChatAccessService,
    ChatR2StorageService,
    ChatPresenceService,
    ChatRealtimeService,
    ChatModerationService,
    ChatSystemMessagesService,
    ChatRealtimeListener,
  ],
  exports: [ChatService, ChatRealtimeService],
})
export class ChatModule {}
