import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { raw } from 'express';
import helmet from 'helmet';

import { getCorsOrigins } from '@community-marketplace/config';

import { AppModule } from './app.module';
import { initTracing } from './libs/tracing.lib';

initTracing();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true, bufferLogs: true });

  app.setGlobalPrefix('api');
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(cookieParser());
  app.use('/api/dev-upload', raw({ type: '*/*', limit: '10mb' }));
  app.enableCors({
    origin: getCorsOrigins(app.get(ConfigService).get<string>('app.corsOrigin', '')),
    credentials: true,
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 4000);

  await app.listen(port);
  console.log(`API running on http://localhost:${port}/api`);
}
bootstrap();
