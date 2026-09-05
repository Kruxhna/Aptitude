const { JOB_TYPES, registerJobHandler, enqueueJob } = require('../src/config/queue');

describe('Phase 0: BullMQ Queue & Idempotency Infrastructure', () => {
  test('registers and executes a registered job handler', async () => {
    let executedPayload = null;
    registerJobHandler('TEST_JOB_TYPE', async (payload) => {
      executedPayload = payload;
    });

    const res = await enqueueJob('TEST_JOB_TYPE', { message: 'hello async' });
    expect(res.queued).toBe(true);

    // Wait for in-process mock execution tick
    await new Promise((r) => setTimeout(r, 50));
    expect(executedPayload).toEqual({ message: 'hello async' });
  });

  test('skips execution when duplicate idempotencyKey is enqueued', async () => {
    let executionCount = 0;
    registerJobHandler('IDEMPOTENT_TEST_JOB', async () => {
      executionCount++;
    });

    const key = `test_key_${Date.now()}`;
    const res1 = await enqueueJob('IDEMPOTENT_TEST_JOB', { data: 1 }, { idempotencyKey: key });
    expect(res1.queued).toBe(true);

    const res2 = await enqueueJob('IDEMPOTENT_TEST_JOB', { data: 2 }, { idempotencyKey: key });
    expect(res2.skipped).toBe(true);
    expect(res2.reason).toBe('IDEMPOTENT_DUPLICATE');
  });
});
