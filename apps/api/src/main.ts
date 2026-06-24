import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

import { getCorsOrigins } from '@community-marketplace/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({
    origin: getCorsOrigins(app.get(ConfigService).get<string>('app.corsOrigin', '')),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 4000);

  await app.listen(port);
  console.log(`API running on http://localhost:${port}/api`);
}

bootstrap();
