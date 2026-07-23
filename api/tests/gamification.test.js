const gamification = require('../src/services/gamification');

describe('Gamification Service', () => {
  describe('Streak Calculation (UTC Midnight)', () => {
    test('Initial sprint sets streak to 1', () => {
      const user = { currentStreak: 0, longestStreak: 0, lastSprintDate: null };
      const now = new Date('2026-07-23T10:00:00Z');
      const updates = gamification.calculateStreakUpdates(user, now);
      expect(updates.currentStreak).toBe(1);
      expect(updates.longestStreak).toBe(1);
      expect(updates.streakFreezeUsed).toBe(false);
    });

    test('Sprint on same day does not increment streak', () => {
      const user = {
        currentStreak: 2,
        longestStreak: 5,
        lastSprintDate: new Date('2026-07-23T08:00:00Z'),
      };
      const now = new Date('2026-07-23T20:00:00Z');
      const updates = gamification.calculateStreakUpdates(user, now);
      expect(updates.currentStreak).toBe(2);
      expect(updates.longestStreak).toBe(5);
    });

    test('Sprint on next consecutive day increments streak', () => {
      const user = {
        currentStreak: 3,
        longestStreak: 3,
        lastSprintDate: new Date('2026-07-22T18:00:00Z'),
      };
      const now = new Date('2026-07-23T10:00:00Z');
      const updates = gamification.calculateStreakUpdates(user, now);
      expect(updates.currentStreak).toBe(4);
      expect(updates.longestStreak).toBe(4);
    });

    test('Missing one day consumes streak freeze', () => {
      const user = {
        currentStreak: 5,
        longestStreak: 10,
        streakFreezeAvailable: true,
        lastSprintDate: new Date('2026-07-21T10:00:00Z'),
      };
      const now = new Date('2026-07-23T10:00:00Z'); // 2 days diff
      const updates = gamification.calculateStreakUpdates(user, now);
      expect(updates.currentStreak).toBe(5); // Preserved
      expect(updates.streakFreezeAvailable).toBe(false);
      expect(updates.streakFreezeUsed).toBe(true);
    });

    test('Missing one day without freeze resets streak to 1', () => {
      const user = {
        currentStreak: 5,
        longestStreak: 10,
        streakFreezeAvailable: false,
        lastSprintDate: new Date('2026-07-21T10:00:00Z'),
      };
      const now = new Date('2026-07-23T10:00:00Z');
      const updates = gamification.calculateStreakUpdates(user, now);
      expect(updates.currentStreak).toBe(1);
    });

    test('Missing multiple days resets streak to 1', () => {
      const user = {
        currentStreak: 5,
        longestStreak: 10,
        streakFreezeAvailable: true,
        lastSprintDate: new Date('2026-07-15T10:00:00Z'),
      };
      const now = new Date('2026-07-23T10:00:00Z');
      const updates = gamification.calculateStreakUpdates(user, now);
      expect(updates.currentStreak).toBe(1);
    });
  });
});
