import { Controller } from '@nestjs/common';

import { RequireRole } from '../../common/decorators/rbac.decorator';
import { ChatController } from '../chat/chat.controller';

/** Buyer namespace — delegates to /chat endpoints */
@RequireRole('BUYER', 'SELLER', 'ADMIN', 'SUPER_ADMIN')
@Controller('buyer/chat')
export class BuyerChatController extends ChatController {}
