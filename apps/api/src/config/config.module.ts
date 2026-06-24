import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { appConfig, databaseConfig } from './app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: ['.env.local', '.env'],
    }),
  ],
})
export class AppConfigModule {}
