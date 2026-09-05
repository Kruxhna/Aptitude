const { Queue, Worker } = require('bullmq');
const redisClient = require('./redis');

const QUEUE_NAME = 'aptitude_async_jobs';

// Job types enum
const JOB_TYPES = {
  ACHIEVEMENT_EVAL: 'ACHIEVEMENT_EVAL',
  DECAY_SCAN: 'DECAY_SCAN',
  NOTIFICATION_DISPATCH: 'NOTIFICATION_DISPATCH',
  SPRINT_EVALUATION: 'SPRINT_EVALUATION',
  LEAGUE_RELEGATION_CHECK: 'LEAGUE_RELEGATION_CHECK',
};

// Handlers registry
const handlers = new Map();

/**
 * Register a handler function for a specific job type.
 * @param {string} type - Job type from JOB_TYPES
 * @param {Function} handler - Async function(payload, jobMeta) => Promise<any>
 */
function registerJobHandler(type, handler) {
  handlers.set(type, handler);
}

// Fallback in-process runner for testing or when Redis is in Mock mode
let bullQueue = null;
let bullWorker = null;

const isMock = process.env.MOCK_REDIS === 'true' || process.env.NODE_ENV === 'test';

function getRedisConnectionOptions() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const url = new URL(redisUrl);
  return {
    host: url.hostname || 'localhost',
    port: parseInt(url.port || '6379', 10),
    password: url.password || undefined,
    maxRetriesPerRequest: null,
  };
}

/**
 * Initialize BullMQ Queue and Worker (or mock runner)
 */
function initQueue() {
  if (isMock) {
    console.log('✓ BullMQ: Initialized with In-Process async runner (Mock/Test mode)');
    return;
  }

  try {
    const connection = getRedisConnectionOptions();

    bullQueue = new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });

    bullWorker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const { type, payload, idempotencyKey } = job.data;
        const handler = handlers.get(type);

        if (!handler) {
          console.warn(`[QueueWorker] No handler registered for job type: ${type}`);
          return;
        }

        return await handler(payload, { jobId: job.id, idempotencyKey, type });
      },
      { connection, concurrency: 5 }
    );

    bullWorker.on('failed', (job, err) => {
      console.error(`[QueueWorker] Job ${job?.id} of type ${job?.data?.type} failed:`, err.message);
    });

    console.log('✓ BullMQ Queue & Worker initialized successfully');
  } catch (err) {
    console.warn('⚠️ BullMQ failed to initialize with Redis. Using fallback runner:', err.message);
    bullQueue = null;
    bullWorker = null;
  }
}

/**
 * Enqueue a job according to the standard contract: { type, payload, idempotencyKey }
 * @param {string} type - Job type
 * @param {object} payload - Job payload
 * @param {object} options - Optional parameters (e.g. { idempotencyKey, delay })
 */
async function enqueueJob(type, payload = {}, options = {}) {
  const { idempotencyKey, delay, repeat } = options;
  const jobData = {
    type,
    payload,
    idempotencyKey: idempotencyKey || null,
    createdAt: Date.now(),
  };

  // Idempotency check if key provided
  if (idempotencyKey) {
    const cacheKey = `job_idempotency:${idempotencyKey}`;
    const alreadyProcessed = await redisClient.get(cacheKey);
    if (alreadyProcessed) {
      console.log(`[Queue] IdempotencyKey ${idempotencyKey} already processed. Skipping.`);
      return { skipped: true, reason: 'IDEMPOTENT_DUPLICATE' };
    }
    // Mark as pending/claimed with 1 hour TTL
    await redisClient.set(cacheKey, 'claimed', 'EX', 3600);
  }

  if (bullQueue) {
    const job = await bullQueue.add(type, jobData, {
      jobId: idempotencyKey || undefined,
      delay,
      repeat,
    });
    return { id: job.id, type, queued: true };
  }

  // Fallback in-process runner (Mock / Test mode)
  process.nextTick(async () => {
    try {
      const handler = handlers.get(type);
      if (handler) {
        await handler(payload, { jobId: `mock_${Date.now()}`, idempotencyKey, type });
      }
    } catch (err) {
      console.error(`[MockQueue] Error executing job ${type}:`, err.message);
    }
  });

  return { id: `mock_${Date.now()}`, type, queued: true, mock: true };
}

/**
 * Graceful shutdown
 */
async function closeQueue() {
  if (bullWorker) await bullWorker.close();
  if (bullQueue) await bullQueue.close();
}

module.exports = {
  JOB_TYPES,
  registerJobHandler,
  initQueue,
  enqueueJob,
  closeQueue,
};
