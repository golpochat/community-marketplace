import { Controller } from '@nestjs/common';

import { RequireRole } from '../../common/decorators/rbac.decorator';
import { ChatController } from '../chat/chat.controller';

/** Seller namespace — delegates to /chat endpoints */
@RequireRole('BUYER', 'SELLER', 'ADMIN', 'SUPER_ADMIN')
@Controller('seller/chat')
export class SellerChatController extends ChatController {}
