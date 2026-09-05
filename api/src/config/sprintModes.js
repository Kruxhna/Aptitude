/**
 * Centralized Sprint Mode Configuration
 * Replaces scattered `if (mode === 'learn')` branching with declarative mode configuration.
 */

const SPRINT_MODE_CONFIG = {
  learn: {
    mode: 'learn',
    displayName: 'Learn & Practice',
    includeScaffolding: true, // Strategy tips, hint levels, wrong-answer explanations
    includeHints: true,
    bonusHints: 3,
    timerEnabled: false,
    updateElo: false, // Learn mode NEVER calls ELO service or touches rating history
    awardsXp: true,
    xpMultiplier: 0.8,
    awardsGems: false,
    affectsStreak: true,
    authoritativeAntiCheat: false,
  },
  test: {
    mode: 'test',
    displayName: 'Ranked Sprint',
    includeScaffolding: false,
    includeHints: true,
    bonusHints: 0,
    timerEnabled: true,
    updateElo: true, // ELO ratings updated dynamically
    awardsXp: true,
    xpMultiplier: 1.0,
    awardsGems: true,
    gemRewardPerStreak: 5,
    affectsStreak: true,
    authoritativeAntiCheat: true,
  },
  battle: {
    mode: 'battle',
    displayName: '1v1 Battle Arena',
    includeScaffolding: false,
    includeHints: false,
    bonusHints: 0,
    timerEnabled: true,
    updateElo: true, // Symmetrical ELO rating updates for both players
    awardsXp: true,
    xpMultiplier: 1.5,
    awardsGems: true,
    gemRewardWin: 25,
    affectsStreak: true,
    authoritativeAntiCheat: true,
  },
};

function getSprintModeConfig(mode = 'test') {
  return SPRINT_MODE_CONFIG[mode] || SPRINT_MODE_CONFIG.test;
}

module.exports = {
  SPRINT_MODE_CONFIG,
  getSprintModeConfig,
};
