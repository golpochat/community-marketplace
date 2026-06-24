import { Controller } from '@nestjs/common';

import { ChatController } from '../chat/chat.controller';

/** Seller namespace — delegates to /chat endpoints */
@Controller('seller/chat')
export class SellerChatController extends ChatController {}
