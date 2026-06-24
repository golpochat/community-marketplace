import { registerAs } from '@nestjs/config';

import { loadApiEnv } from '@community-marketplace/config';

export const appConfig = registerAs('app', () => {
  const env = loadApiEnv();
  return {
    name: env.APP_NAME,
    env: env.NODE_ENV,
    port: env.PORT,
    corsOrigin: env.CORS_ORIGIN,
  };
});

export const databaseConfig = registerAs('database', () => {
  const env = loadApiEnv();
  return {
    url: env.DATABASE_URL,
    logging: env.DATABASE_LOGGING,
  };
});
