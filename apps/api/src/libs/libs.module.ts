import { Global, Module } from '@nestjs/common';

import { LoggerLib } from './logger.lib';
import { RedisCacheService } from './redis-cache.service';

@Global()
@Module({
  providers: [LoggerLib, RedisCacheService],
  exports: [LoggerLib, RedisCacheService],
})
export class LibsModule {}
