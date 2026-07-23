const { normalizeElo } = require('../src/routes/analytics');

describe('Analytics Service', () => {
  describe('normalizeElo (D-43: Linear 800–1400 → 0–100)', () => {
    test('ELO 800 normalizes to 0', () => {
      expect(normalizeElo(800)).toBe(0);
    });

    test('ELO 1100 normalizes to 50', () => {
      expect(normalizeElo(1100)).toBe(50);
    });

    test('ELO 1400 normalizes to 100', () => {
      expect(normalizeElo(1400)).toBe(100);
    });

    test('ELO below 800 clamps to 0', () => {
      expect(normalizeElo(600)).toBe(0);
      expect(normalizeElo(0)).toBe(0);
    });

    test('ELO above 1400 clamps to 100', () => {
      expect(normalizeElo(1600)).toBe(100);
      expect(normalizeElo(2000)).toBe(100);
    });

    test('ELO 950 normalizes to 25', () => {
      expect(normalizeElo(950)).toBe(25);
    });

    test('ELO 1250 normalizes to 75', () => {
      expect(normalizeElo(1250)).toBe(75);
    });
  });
});
