import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from './prisma.service';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        url: config.get<string>('database.url'),
        connected: false,
      }),
    },
  ],
  exports: [DATABASE_CONNECTION, PrismaService],
})
export class DatabaseModule {}
