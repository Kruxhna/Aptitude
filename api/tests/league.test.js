/**
 * League Service Tests
 * Tests league promotion/demotion cron logic including boundary XP values.
 */

const { computeTierForXP, LEAGUE_THRESHOLDS, TIER_ORDER, tierIndex } = require('../src/services/leagueService');

describe('League Service', () => {
  describe('computeTierForXP', () => {
    // Boundary tests from the spec
    test('XP 0 → Bronze', () => {
      expect(computeTierForXP(0)).toBe('Bronze');
    });

    test('XP 50 → Bronze (upper boundary)', () => {
      expect(computeTierForXP(50)).toBe('Bronze');
    });

    test('XP 51 → Silver (lower boundary)', () => {
      expect(computeTierForXP(51)).toBe('Silver');
    });

    test('XP 150 → Silver (upper boundary)', () => {
      expect(computeTierForXP(150)).toBe('Silver');
    });

    test('XP 151 → Gold (lower boundary)', () => {
      expect(computeTierForXP(151)).toBe('Gold');
    });

    test('XP 300 → Gold (upper boundary)', () => {
      expect(computeTierForXP(300)).toBe('Gold');
    });

    test('XP 301 → Platinum (lower boundary)', () => {
      expect(computeTierForXP(301)).toBe('Platinum');
    });

    test('XP 500 → Platinum (upper boundary)', () => {
      expect(computeTierForXP(500)).toBe('Platinum');
    });

    test('XP 501 → Diamond (lower boundary)', () => {
      expect(computeTierForXP(501)).toBe('Diamond');
    });

    test('XP 800 → Diamond (upper boundary)', () => {
      expect(computeTierForXP(800)).toBe('Diamond');
    });

    test('XP 801 → Titan (lower boundary)', () => {
      expect(computeTierForXP(801)).toBe('Titan');
    });

    test('XP 5000 → Titan (far above)', () => {
      expect(computeTierForXP(5000)).toBe('Titan');
    });

    // Mid-range tests
    test('XP 100 → Silver (mid-range)', () => {
      expect(computeTierForXP(100)).toBe('Silver');
    });

    test('XP 225 → Gold (mid-range)', () => {
      expect(computeTierForXP(225)).toBe('Gold');
    });

    test('XP 400 → Platinum (mid-range)', () => {
      expect(computeTierForXP(400)).toBe('Platinum');
    });

    test('XP 650 → Diamond (mid-range)', () => {
      expect(computeTierForXP(650)).toBe('Diamond');
    });
  });

  describe('LEAGUE_THRESHOLDS', () => {
    test('all 6 tiers have min and max', () => {
      TIER_ORDER.forEach(tier => {
        expect(LEAGUE_THRESHOLDS[tier]).toBeDefined();
        expect(typeof LEAGUE_THRESHOLDS[tier].min).toBe('number');
        expect(typeof LEAGUE_THRESHOLDS[tier].max).toBe('number');
      });
    });

    test('tiers are contiguous (no gaps)', () => {
      for (let i = 1; i < TIER_ORDER.length; i++) {
        const prevMax = LEAGUE_THRESHOLDS[TIER_ORDER[i - 1]].max;
        const currMin = LEAGUE_THRESHOLDS[TIER_ORDER[i]].min;
        expect(currMin).toBe(prevMax + 1);
      }
    });
  });

  describe('tierIndex', () => {
    test('Bronze = 0', () => expect(tierIndex('Bronze')).toBe(0));
    test('Silver = 1', () => expect(tierIndex('Silver')).toBe(1));
    test('Gold = 2', () => expect(tierIndex('Gold')).toBe(2));
    test('Platinum = 3', () => expect(tierIndex('Platinum')).toBe(3));
    test('Diamond = 4', () => expect(tierIndex('Diamond')).toBe(4));
    test('Titan = 5', () => expect(tierIndex('Titan')).toBe(5));
    test('unknown = -1', () => expect(tierIndex('Unknown')).toBe(-1));
  });

  describe('promotion/demotion scenarios', () => {
    test('Bronze user with 51 XP is promoted to Silver', () => {
      const oldTier = 'Bronze';
      const newTier = computeTierForXP(51);
      expect(newTier).toBe('Silver');
      expect(tierIndex(newTier)).toBeGreaterThan(tierIndex(oldTier));
    });

    test('Silver user with 30 XP is demoted to Bronze', () => {
      const oldTier = 'Silver';
      const newTier = computeTierForXP(30);
      expect(newTier).toBe('Bronze');
      expect(tierIndex(newTier)).toBeLessThan(tierIndex(oldTier));
    });

    test('Gold user with 250 XP stays in Gold (no change)', () => {
      const oldTier = 'Gold';
      const newTier = computeTierForXP(250);
      expect(newTier).toBe('Gold');
      expect(tierIndex(newTier)).toBe(tierIndex(oldTier));
    });

    test('Diamond user with 801 XP promotes to Titan', () => {
      const oldTier = 'Diamond';
      const newTier = computeTierForXP(801);
      expect(newTier).toBe('Titan');
      expect(tierIndex(newTier)).toBeGreaterThan(tierIndex(oldTier));
    });

    test('Titan user with 800 XP demotes to Diamond', () => {
      const oldTier = 'Titan';
      const newTier = computeTierForXP(800);
      expect(newTier).toBe('Diamond');
      expect(tierIndex(newTier)).toBeLessThan(tierIndex(oldTier));
    });

    test('multi-tier demotion: Platinum → Bronze (0 XP)', () => {
      const oldTier = 'Platinum';
      const newTier = computeTierForXP(0);
      expect(newTier).toBe('Bronze');
      expect(tierIndex(newTier)).toBeLessThan(tierIndex(oldTier));
    });
  });
});
