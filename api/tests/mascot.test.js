const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const http = require('http');

let mongoServer;
let server;
let baseUrl;
let User;

jest.setTimeout(60_000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  User = require('../src/models/User');
  const mascotRoutes = require('../src/routes/mascot');

  const app = express();
  app.use(express.json());

  // Test middleware that sets req.userId
  app.use(async (req, res, next) => {
    let testUser = await User.findOne({ authId: 'test_mascot_user' });
    if (!testUser) {
      testUser = await User.create({
        authId: 'test_mascot_user',
        displayName: 'Mascot Tester',
        xpTotal: 1200,
        mascot: {
          activeCostume: 'DEFAULT',
          unlockedCostumes: ['DEFAULT'],
        },
      });
    }
    req.userId = testUser._id;
    next();
  });

  app.use(mascotRoutes);

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

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

describe('Mascot & Costumes Endpoints', () => {
  test('GET /api/mascot/costumes returns full catalog with ownership status', async () => {
    const res = await fetch(`${baseUrl}/api/mascot/costumes`);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(Array.isArray(body.costumes)).toBe(true);
    expect(body.costumes.length).toBeGreaterThanOrEqual(6);
    expect(body.activeCostume).toBe('DEFAULT');
    expect(body.unlockedCostumes).toContain('DEFAULT');
    expect(body.xpBalance).toBe(1200);

    const defaultCostume = body.costumes.find((c) => c.id === 'DEFAULT');
    expect(defaultCostume.isUnlocked).toBe(true);
    expect(defaultCostume.isEquipped).toBe(true);

    const gradCap = body.costumes.find((c) => c.id === 'GRAD_CAP');
    expect(gradCap.isUnlocked).toBe(false);
    expect(gradCap.isEquipped).toBe(false);
    expect(gradCap.priceXP).toBe(500);
  });

  test('POST /api/mascot/costumes/purchase unlocks costume and deducts XP', async () => {
    const res = await fetch(`${baseUrl}/api/mascot/costumes/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ costumeId: 'GRAD_CAP' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.unlockedCostumes).toContain('GRAD_CAP');
    expect(body.xpBalance).toBe(700); // 1200 - 500

    // Duplicate purchase returns 400
    const resDuplicate = await fetch(`${baseUrl}/api/mascot/costumes/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ costumeId: 'GRAD_CAP' }),
    });

    expect(resDuplicate.status).toBe(400);
  });

  test('POST /api/mascot/costumes/purchase fails with 400 when XP is insufficient', async () => {
    const res = await fetch(`${baseUrl}/api/mascot/costumes/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ costumeId: 'ASTRONAUT_HELMET' }), // 2000 XP (user has 1200)
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Insufficient XP');
  });

  test('POST /api/mascot/costumes/equip equips an unlocked costume', async () => {
    // First purchase
    await fetch(`${baseUrl}/api/mascot/costumes/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ costumeId: 'GRAD_CAP' }),
    });

    // Then equip
    const equipRes = await fetch(`${baseUrl}/api/mascot/costumes/equip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ costumeId: 'GRAD_CAP' }),
    });

    expect(equipRes.status).toBe(200);
    const equipBody = await equipRes.json();
    expect(equipBody.success).toBe(true);
    expect(equipBody.activeCostume).toBe('GRAD_CAP');
  });

  test('POST /api/mascot/costumes/equip rejects equipping locked costumes with 403', async () => {
    const equipRes = await fetch(`${baseUrl}/api/mascot/costumes/equip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ costumeId: 'WIZARD_HAT' }),
    });

    expect(equipRes.status).toBe(403);
    const body = await equipRes.json();
    expect(body.error).toContain('not been unlocked');
  });
});
