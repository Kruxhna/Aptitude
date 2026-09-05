const redisClient = require('../config/redis');

/**
 * Idempotency middleware for mutating endpoints.
 * Extracts `Idempotency-Key` from headers, checks Redis cache,
 * and caches response payloads with a 24-hour TTL.
 */
function requireIdempotency(ttlSeconds = 86400) {
  return async function idempotencyMiddleware(req, res, next) {
    const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

    if (!idempotencyKey) {
      return next();
    }

    const userId = req.userId ? req.userId.toString() : 'anon';
    const cacheKey = `idempotency:${userId}:${idempotencyKey}`;

    try {
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.status === 'PROCESSING') {
          return res.status(409).json({
            error: 'A request with this Idempotency-Key is currently processing. Please wait.',
          });
        }

        // Return cached response
        res.setHeader('X-Cache-Lookup', 'HIT');
        return res.status(parsed.statusCode || 200).json(parsed.body);
      }

      // Mark key as in-flight
      await redisClient.set(
        cacheKey,
        JSON.stringify({ status: 'PROCESSING', startedAt: Date.now() }),
        'EX',
        120
      );

      // Wrap res.json to capture response
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        const responseData = {
          status: 'COMPLETED',
          statusCode: res.statusCode || 200,
          body,
          completedAt: Date.now(),
        };

        // Cache the successful completion asynchronously
        redisClient
          .set(cacheKey, JSON.stringify(responseData), 'EX', ttlSeconds)
          .catch((err) => console.warn('[Idempotency] Failed to cache response:', err.message));

        return originalJson(body);
      };

      next();
    } catch (err) {
      console.warn('[Idempotency] Redis check error:', err.message);
      next();
    }
  };
}

module.exports = {
  requireIdempotency,
};
