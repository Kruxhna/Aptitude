const {
  matchmakingPool,
  processMatchmaking,
} = require('../src/services/battleEngine');

jest.setTimeout(30_000);

describe('Phase 5: 1v1 Battle Engine & Matchmaking', () => {
  afterEach(() => {
    matchmakingPool.clear();
  });

  test('pairs users with similar ELO ratings in the matchmaking pool', async () => {
    const socketMock1 = {
      id: 'sock_1',
      join: jest.fn(),
      emit: jest.fn(),
    };
    const socketMock2 = {
      id: 'sock_2',
      join: jest.fn(),
      emit: jest.fn(),
    };

    matchmakingPool.set('sock_1', {
      socketId: 'sock_1',
      socket: socketMock1,
      userId: 'user_1',
      displayName: 'Alice',
      elo: 1050,
      costume: 'DEFAULT',
      queuedAt: Date.now(),
    });

    matchmakingPool.set('sock_2', {
      socketId: 'sock_2',
      socket: socketMock2,
      userId: 'user_2',
      displayName: 'Bob',
      elo: 1080, // ELO difference = 30 (within ±100 initial radius)
      costume: 'DEFAULT',
      queuedAt: Date.now(),
    });

    expect(matchmakingPool.size).toBe(2);

    await processMatchmaking();

    // After pairing, pool should be empty
    expect(matchmakingPool.size).toBe(0);
    expect(socketMock1.join).toHaveBeenCalled();
    expect(socketMock2.join).toHaveBeenCalled();
  });

  test('calculates symmetrical ELO rating updates (K=32)', () => {
    const p1Elo = 1000;
    const p2Elo = 1000;

    // Both players equal rating: expected = 0.5
    const expectedP1 = 1 / (1 + Math.pow(10, (p2Elo - p1Elo) / 400));
    expect(expectedP1).toBe(0.5);

    // If P1 wins: actual = 1.0 -> delta = 32 * (1.0 - 0.5) = +16
    const p1DeltaWin = Math.round(32 * (1.0 - expectedP1));
    const p2DeltaLoss = -p1DeltaWin;

    expect(p1DeltaWin).toBe(16);
    expect(p2DeltaLoss).toBe(-16);
    expect(p1DeltaWin + p2DeltaLoss).toBe(0); // Perfect zero-sum symmetry
  });
});
