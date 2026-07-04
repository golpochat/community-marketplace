import { Controller, Get } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { PlatformGovernanceService } from './platform-governance.service';

@Controller('platform')
export class PlatformController {
  constructor(private readonly governance: PlatformGovernanceService) {}

  @Public()
  @Get('meta')
  getMeta() {
    return this.governance.getPublicMeta();
  }
}
