const Redis = require('ioredis');

class MockRedis {
  constructor() {
    this.store = new Map();
    console.log('✓ Redis: Using In-Memory Mock client');
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, mode, duration) {
    let expiry = null;
    if (mode === 'EX' && duration) {
      expiry = Date.now() + (duration * 1000);
    }
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }

  async exists(key) {
    const val = await this.get(key);
    return val !== null ? 1 : 0;
  }

  on(event, callback) {
    if (event === 'connect') {
      // Simulate async connection
      process.nextTick(callback);
    }
    return this;
  }

  disconnect() {
    console.log('✓ Mock Redis disconnected');
  }
}

let redis;

if (process.env.MOCK_REDIS === 'true') {
  redis = new MockRedis();
} else {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        console.warn(`Redis connection failed after ${times} retries. Falling back to In-Memory Mock client.`);
        redis = new MockRedis();
        return null; // Stop retrying
      }
      return Math.min(times * 100, 2000);
    }
  });

  redis.on('connect', () => {
    console.log(`✓ Redis connected: ${redisUrl}`);
  });

  redis.on('error', (err) => {
    console.error('✗ Redis connection error:', err.message);
  });
}

// Proxy export so we can dynamically swap out the instance if the connection strategy falls back
const redisProxy = new Proxy({}, {
  get(target, prop) {
    return redis[prop];
  }
});

module.exports = redisProxy;
