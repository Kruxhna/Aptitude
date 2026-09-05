const redisClient = require('../config/redis');

/**
 * Creates an Express rate-limiting middleware using Redis.
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Max number of requests allowed per window
 * @param {string} options.prefix - Redis key prefix
 * @param {string} options.message - Error response message
 */
function createRateLimiter({
  windowMs = 60 * 1000,
  max = 60,
  prefix = 'rl',
  message = 'Too many requests, please try again later.',
} = {}) {
  const windowSec = Math.ceil(windowMs / 1000);

  return async function rateLimiterMiddleware(req, res, next) {
    const identifier = req.userId ? req.userId.toString() : (req.ip || 'anonymous');
    const key = `${prefix}:${identifier}:${Math.floor(Date.now() / windowMs)}`;

    try {
      let count = 1;
      const current = await redisClient.get(key);

      if (current !== null) {
        count = parseInt(current, 10) + 1;
        if (count > max) {
          res.setHeader('Retry-After', windowSec);
          return res.status(429).json({
            error: message,
            retryAfterSeconds: windowSec,
          });
        }
        await redisClient.set(key, count.toString(), 'EX', windowSec);
      } else {
        await redisClient.set(key, '1', 'EX', windowSec);
      }

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
      next();
    } catch (err) {
      console.warn('[RateLimiter] Error querying Redis. Allowing request through:', err.message);
      next();
    }
  };
}

// Preset rate limiters
const generalMutateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 45,
  prefix: 'rl:mutate',
  message: 'Too many mutating requests. Please wait a moment.',
});

const shopPurchaseLimiter = createRateLimiter({
  windowMs: 30 * 1000,
  max: 10,
  prefix: 'rl:shop',
  message: 'Purchase request limit reached. Please wait before retrying.',
});

const sprintSubmitLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  prefix: 'rl:sprint',
  message: 'Sprint submission limit reached. Please try again in a minute.',
});

module.exports = {
  createRateLimiter,
  generalMutateLimiter,
  shopPurchaseLimiter,
  sprintSubmitLimiter,
};
