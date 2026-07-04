import { Global, Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { PlatformController } from './platform.controller';
import { PlatformGovernanceService } from './platform-governance.service';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [PlatformController],
  providers: [PlatformGovernanceService],
  exports: [PlatformGovernanceService],
})
export class PlatformModule {}
