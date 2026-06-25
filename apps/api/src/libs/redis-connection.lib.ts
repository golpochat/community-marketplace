import Redis from 'ioredis';

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
