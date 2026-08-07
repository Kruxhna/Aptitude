const gamification = require('../src/services/gamification');

/**
 * gamification.test.js
 * Tests calculateStreakUpdates() against the new canonical schema:
 *   - User input:  user.streak.{ current, freezesAvailable, lastCompletedUTCDate }
 *   - Return keys: 'streak.current', 'streak.freezesAvailable', 'streak.lastCompletedUTCDate', freezeUsed
 */
describe('Gamification Service', () => {
  describe('Streak Calculation (UTC Midnight)', () => {

    test('Initial sprint (no prior date) sets streak to 1', () => {
      const user = { streak: { current: 0, freezesAvailable: 1, lastCompletedUTCDate: null } };
      const now = new Date('2026-07-23T10:00:00Z');
      const updates = gamification.calculateStreakUpdates(user, now);

      expect(updates['streak.current']).toBe(1);
      expect(updates['streak.lastCompletedUTCDate']).toBe('2026-07-23');
      expect(updates.freezeUsed).toBe(false);
    });

    test('Sprint on same UTC day does not increment streak', () => {
      const user = {
        streak: { current: 2, freezesAvailable: 1, lastCompletedUTCDate: '2026-07-23' },
      };
      const now = new Date('2026-07-23T20:00:00Z');
      const updates = gamification.calculateStreakUpdates(user, now);

      expect(updates['streak.current']).toBe(2);
      expect(updates['streak.lastCompletedUTCDate']).toBe('2026-07-23');
    });

    test('Sprint on next consecutive UTC day increments streak', () => {
      const user = {
        streak: { current: 3, freezesAvailable: 1, lastCompletedUTCDate: '2026-07-22' },
      };
      const now = new Date('2026-07-23T10:00:00Z');
      const updates = gamification.calculateStreakUpdates(user, now);

      expect(updates['streak.current']).toBe(4);
      expect(updates['streak.lastCompletedUTCDate']).toBe('2026-07-23');
    });

    test('Missing exactly one day consumes one freeze and still increments streak', () => {
      const user = {
        streak: { current: 5, freezesAvailable: 1, lastCompletedUTCDate: '2026-07-21' },
      };
      const now = new Date('2026-07-23T10:00:00Z'); // dayDiff === 2
      const updates = gamification.calculateStreakUpdates(user, now);

      expect(updates['streak.current']).toBe(6); // Preserved + incremented for today
      expect(updates['streak.freezesAvailable']).toBe(0);
      expect(updates.freezeUsed).toBe(true);
    });

    test('Missing one day without any freeze resets streak to 1', () => {
      const user = {
        streak: { current: 5, freezesAvailable: 0, lastCompletedUTCDate: '2026-07-21' },
      };
      const now = new Date('2026-07-23T10:00:00Z');
      const updates = gamification.calculateStreakUpdates(user, now);

      expect(updates['streak.current']).toBe(1);
      expect(updates.freezeUsed).toBe(false);
    });

    test('Missing multiple days (3+) resets streak to 1 regardless of freeze', () => {
      const user = {
        streak: { current: 5, freezesAvailable: 1, lastCompletedUTCDate: '2026-07-15' },
      };
      const now = new Date('2026-07-23T10:00:00Z'); // dayDiff === 8
      const updates = gamification.calculateStreakUpdates(user, now);

      expect(updates['streak.current']).toBe(1);
      // Freeze is NOT consumed for multi-day gaps
      expect(updates['streak.freezesAvailable']).toBe(1);
    });
  });
});
