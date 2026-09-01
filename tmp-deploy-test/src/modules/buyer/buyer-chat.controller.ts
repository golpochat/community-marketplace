import { Controller } from '@nestjs/common';

import { ChatController } from '../chat/chat.controller';

/** Buyer namespace — delegates to /chat endpoints */
@Controller('buyer/chat')
export class BuyerChatController extends ChatController {}
