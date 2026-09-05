const {
  calculateStability,
  calculateRetention,
  applyLazyDecay,
  DECAY_THRESHOLD_REVIEW,
} = require('../src/services/decayEngine');
const {
  evaluateAchievements,
  getLocalHour,
  BADGES,
} = require('../src/services/achievementEngine');

describe('Phase 2: Spaced Repetition Decay & Achievements', () => {
  describe('Memory Decay Engine', () => {
    test('calculates stability with accuracy bonus', () => {
      // 100% accuracy -> bonus = (1.0 - 0.5) * 2 = 1.0 -> S = 14 * 2 = 28 days
      const s100 = calculateStability(1.0, 14);
      expect(s100).toBe(28);

      // 50% accuracy -> bonus = (0.5 - 0.5) * 2 = 0 -> S = 14 * 1 = 14 days
      const s50 = calculateStability(0.5, 14);
      expect(s50).toBe(14);
    });

    test('calculates exponential retention curve R = e^(-dt/S)', () => {
      // Day 0: R = 1.0
      expect(calculateRetention(0, 14)).toBe(1.0);

      // Day 14 with S=14: R = e^(-1) ≈ 0.368
      const r14 = calculateRetention(14, 14);
      expect(r14).toBeCloseTo(0.368, 2);
    });

    test('applyLazyDecay flags node as REVIEW when retention falls below threshold', () => {
      const now = new Date('2026-08-27T12:00:00Z');
      // Completed 30 days ago with 50% accuracy (S=14, delta=30, R=e^(-30/14)=0.117 < 0.70)
      const oldDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const progress = [
        {
          nodeId: 'node-1',
          state: 'PERFECT',
          accuracy: 0.5,
          completedAt: oldDate,
        },
      ];

      const decayed = applyLazyDecay(progress, now);
      expect(decayed[0].state).toBe('REVIEW');
      expect(decayed[0].retention).toBeLessThan(DECAY_THRESHOLD_REVIEW);
    });
  });

  describe('Achievement Engine', () => {
    test('evaluates Night Owl based on server UTC + stored user IANA timezone', () => {
      const mockUser = {
        timezone: 'Asia/Kolkata', // UTC+5:30
        achievements: [],
      };

      // 18:00 UTC = 23:30 in Asia/Kolkata (11:30 PM -> Night Owl window: 11 PM - 2 AM)
      const lateNightUtc = new Date('2026-08-27T18:00:00Z');
      const hour = getLocalHour(lateNightUtc, 'Asia/Kolkata');
      expect(hour).toBe(23);

      const badges = evaluateAchievements(mockUser, { accuracy: 1.0 }, { timestamp: lateNightUtc });
      const hasNightOwl = badges.some((b) => b.id === 'NIGHT_OWL');
      expect(hasNightOwl).toBe(true);
    });

    test('evaluates Speed Demon badge for swift flawless sprint', () => {
      const mockUser = {
        timezone: 'UTC',
        achievements: [],
      };

      const fastSession = {
        accuracy: 1.0,
        totalQuestions: 5,
        results: [
          { timeMs: 4000, correct: true, skill: 'quantitative' },
          { timeMs: 5000, correct: true, skill: 'quantitative' },
          { timeMs: 4500, correct: true, skill: 'quantitative' },
          { timeMs: 6000, correct: true, skill: 'quantitative' },
          { timeMs: 5500, correct: true, skill: 'quantitative' },
        ],
      };

      const badges = evaluateAchievements(mockUser, fastSession);
      expect(badges.some((b) => b.id === 'SPEED_DEMON')).toBe(true);
      expect(badges.some((b) => b.id === 'FLAWLESS_QUANT')).toBe(true);
    });
  });
});
