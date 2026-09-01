import { Global, Module } from '@nestjs/common';

import { ApiUtilsService } from './api-utils.service';

@Global()
@Module({
  providers: [ApiUtilsService],
  exports: [ApiUtilsService],
})
export class UtilsModule {}
