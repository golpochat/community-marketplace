import { createServer } from 'node:http';

import { NestFactory } from '@nestjs/core';

import { initTracing } from './libs/tracing.lib';
import { WorkerAppModule } from './worker-app.module';

initTracing();

async function bootstrap() {
  process.env.BULLMQ_MODE = process.env.BULLMQ_MODE ?? 'worker';

  const app = await NestFactory.createApplicationContext(WorkerAppModule, {
    logger: ['error', 'warn', 'log'],
  });
  await app.init();

  const port = Number(process.env.WORKER_HEALTH_PORT ?? 4001);
  const server = createServer((req, res) => {
    if (req.url === '/health' || req.url === '/health/live') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', mode: 'worker', timestamp: new Date().toISOString() }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  server.listen(port, () => {
    console.log(`BullMQ worker health listening on :${port}/health`);
  });
}

bootstrap();
