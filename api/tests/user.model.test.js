const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Allow extra time for mongodb-memory-server binary download on first run
jest.setTimeout(60_000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

describe('User Model Schema', () => {
  // Re-require after mongoose is connected to avoid model compilation issues
  const User = require('../src/models/User');

  test('minimal valid user has correct defaults', async () => {
    const user = new User({ authId: 'auth_test_001', displayName: 'Test User' });
    const validated = user.toObject();

    // Required fields present
    expect(validated.authId).toBe('auth_test_001');
    expect(validated.displayName).toBe('Test User');

    // Defaults
    expect(validated.xpTotal).toBe(0);

    // ELO defaults
    expect(validated.elo.verbal).toBe(1000);
    expect(validated.elo.quantitative).toBe(1000);
    expect(validated.elo.logical).toBe(1000);
    expect(validated.elo.spatial).toBe(1000);

    // Streak defaults
    expect(validated.streak.current).toBe(0);
    expect(validated.streak.freezesAvailable).toBe(1);
    expect(validated.streak.lastCompletedUTCDate).toBeNull();

    // createdAt is set
    expect(validated.createdAt).toBeInstanceOf(Date);

    // Save should succeed
    const saved = await user.save();
    expect(saved._id).toBeDefined();
  });

  test('duplicate authId throws duplicate key error', async () => {
    const userData = { authId: 'auth_dup_test', displayName: 'User One' };

    await new User(userData).save();

    let error;
    try {
      await new User({ ...userData, displayName: 'User Two' }).save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // MongoDB duplicate key error code
  });

  test('missing authId fails validation', async () => {
    const user = new User({ displayName: 'No Auth' });

    let error;
    try {
      await user.validate();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.authId).toBeDefined();
  });

  test('missing displayName fails validation', async () => {
    const user = new User({ authId: 'auth_no_name' });

    let error;
    try {
      await user.validate();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.displayName).toBeDefined();
  });
});
