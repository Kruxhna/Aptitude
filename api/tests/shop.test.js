const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const http = require('http');
const axios = require('axios');

let mongoServer;
let server;
let baseUrl;
let User;
let GemTransaction;

jest.setTimeout(60_000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  User = require('../src/models/User');
  GemTransaction = require('../src/models/GemTransaction');
  const shopRoutes = require('../src/routes/shop');

  const app = express();
  app.use(express.json());

  app.use(async (req, res, next) => {
    let testUser = await User.findOne({ authId: 'test_shop_user' });
    if (!testUser) {
      testUser = await User.create({
        authId: 'test_shop_user',
        displayName: 'Shop Tester',
        gems: 100,
        streak: { current: 3, freezesAvailable: 1 },
        mascot: { activeCostume: 'DEFAULT', unlockedCostumes: ['DEFAULT'] },
      });
    }
    req.userId = testUser._id;
    next();
  });

  app.use(shopRoutes);

  await new Promise((resolve) => {
    server = http.createServer(app).listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  if (server) await new Promise((r) => server.close(r));
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Phase 1: Transactional Gem Economy & Shop', () => {
  test('GET /api/shop/catalog returns item catalog and user gems', async () => {
    const res = await axios.get(`${baseUrl}/api/shop/catalog`);
    expect(res.status).toBe(200);
    expect(res.data.gems).toBe(100);
    expect(Array.isArray(res.data.items)).toBe(true);
    expect(res.data.items.length).toBeGreaterThanOrEqual(4);
  });

  test('POST /api/shop/buy-item atomically deducts gems, increments freeze, and logs GemTransaction', async () => {
    const res = await axios.post(`${baseUrl}/api/shop/buy-item`, {
      itemId: 'streak_freeze',
    });

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.gems).toBe(50); // 100 - 50 = 50
    expect(res.data.freezesAvailable).toBe(2); // 1 + 1 = 2

    // Verify GemTransaction audit log
    const user = await User.findOne({ authId: 'test_shop_user' });
    const txn = await GemTransaction.findOne({ userId: user._id, refId: 'streak_freeze' });
    expect(txn).not.toBeNull();
    expect(txn.delta).toBe(-50);
    expect(txn.reason).toBe('PURCHASE');
    expect(txn.balanceAfter).toBe(50);
  });

  test('POST /api/shop/buy-item rejects when balance is insufficient (double-spend protection)', async () => {
    // Current balance is 50, cost of wizard hat is 150
    try {
      await axios.post(`${baseUrl}/api/shop/buy-item`, {
        itemId: 'mascot_wizard_hat',
      });
      throw new Error('Should have failed');
    } catch (err) {
      expect(err.response.status).toBe(400);
      expect(err.response.data.error).toContain('Insufficient gems');
    }
  });

  test('POST /api/shop/buy-item activates double XP boost and stacks duration', async () => {
    // Give user 100 gems
    await User.updateOne({ authId: 'test_shop_user' }, { gems: 100 });

    // Buy 15m boost
    const res1 = await axios.post(`${baseUrl}/api/shop/buy-item`, {
      itemId: 'double_xp_15m',
    });
    expect(res1.data.activeBoosts.length).toBe(1);
    const expiry1 = new Date(res1.data.activeBoosts[0].expiresAt).getTime();

    // Buy another 15m boost — stacking rule should extend expiry by 15 more minutes
    const res2 = await axios.post(`${baseUrl}/api/shop/buy-item`, {
      itemId: 'double_xp_15m',
    });
    expect(res2.data.activeBoosts.length).toBe(1);
    const expiry2 = new Date(res2.data.activeBoosts[0].expiresAt).getTime();

    expect(expiry2 - expiry1).toBeCloseTo(15 * 60 * 1000, -3);
  });
});
