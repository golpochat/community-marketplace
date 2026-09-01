import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { ShareController } from './share.controller';
import { ShareService } from './share.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ShareController],
  providers: [ShareService],
  exports: [ShareService],
})
export class ShareModule {}
