import { Global, Module } from '@nestjs/common';

import { LoggerLib } from './logger.lib';

@Global()
@Module({
  providers: [LoggerLib],
  exports: [LoggerLib],
})
export class LibsModule {}
