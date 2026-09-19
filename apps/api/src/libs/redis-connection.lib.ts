import Redis from 'ioredis';

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function assertRedisConfiguredForProduction(
  context: string,
  redisUrl: string | undefined,
): void {
  if (!isProductionRuntime()) return;
  if (!redisUrl) {
    throw new Error(`${context}: REDIS_URL is required in production`);
  }
}

export function assertRedisReachableForProduction(context: string, available: boolean): void {
  if (!isProductionRuntime()) return;
  if (!available) {
    throw new Error(`${context}: Redis is unreachable in production — refusing in-process fallback`);
  }
}

export async function probeRedisUrl(redisUrl: string): Promise<boolean> {
  const client = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
    enableOfflineQueue: false,
  });

  const swallowErrors = () => {};
  client.on('error', swallowErrors);

  try {
    await client.connect();
    const pong = await client.ping();
    return pong === 'PONG';
  } catch {
    return false;
  } finally {
    client.removeAllListeners();
    client.disconnect();
  }
}

export async function createRedisClient(redisUrl: string): Promise<Redis | null> {
  const client = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    enableOfflineQueue: false,
  });

  const swallowErrors = () => {};
  client.on('error', swallowErrors);

  try {
    await client.connect();
    const pong = await client.ping();
    if (pong !== 'PONG') return null;
    client.off('error', swallowErrors);
    return client;
  } catch {
    client.removeAllListeners();
    client.disconnect();
    return null;
  }
}
