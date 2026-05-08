import { Redis } from 'ioredis';

export const getRedisConnection = () => {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  const password = process.env.REDIS_PASSWORD || undefined;

  return new Redis(url, {
    password,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
};

export const redisConnection = getRedisConnection();
