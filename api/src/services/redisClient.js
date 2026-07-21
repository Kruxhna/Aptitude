const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) {
      console.warn(`Redis connection failed after ${times} retries. Continuing in degraded state.`);
      return null; // Stop retrying
    }
    return Math.min(times * 100, 2000);
  }
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err.message);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis successfully');
});

module.exports = redisClient;
