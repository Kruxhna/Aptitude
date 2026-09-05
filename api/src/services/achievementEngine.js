const { GemTransaction } = require('../models');

const BADGES = {
  NIGHT_OWL: {
    id: 'NIGHT_OWL',
    title: 'Night Owl',
    description: 'Complete a sprint between 11 PM and 2 AM in your local timezone.',
    icon: '🦉',
    gemReward: 20,
  },
  SPEED_DEMON: {
    id: 'SPEED_DEMON',
    title: 'Speed Demon',
    description: 'Score 100% accuracy with swift responses on every question.',
    icon: '⚡',
    gemReward: 25,
  },
  STREAK_7: {
    id: 'STREAK_7',
    title: '7-Day Champion',
    description: 'Maintain a 7-day active practice streak.',
    icon: '🔥',
    gemReward: 50,
  },
  STREAK_30: {
    id: 'STREAK_30',
    title: 'Monthly Legend',
    description: 'Maintain a 30-day active practice streak.',
    icon: '👑',
    gemReward: 150,
  },
  FLAWLESS_QUANT: {
    id: 'FLAWLESS_QUANT',
    title: 'Quantitative Prodigy',
    description: 'Achieve 100% accuracy on a Quantitative sprint.',
    icon: '📐',
    gemReward: 30,
  },
  GLADIATOR_10: {
    id: 'GLADIATOR_10',
    title: 'Arena Gladiator',
    description: 'Win 10 live 1v1 aptitude battles.',
    icon: '⚔️',
    gemReward: 100,
  },
};

/**
 * Determine local hour based on UTC timestamp and user IANA timezone.
 * Resolves Night Owl without client spoofing.
 */
function getLocalHour(utcDate = new Date(), timezone = 'UTC') {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    return parseInt(formatter.format(utcDate), 10);
  } catch {
    return utcDate.getUTCHours();
  }
}

/**
 * Pure evaluation function (sessionResult) => newAchievements[]
 * @param {object} user - User document
 * @param {object} sessionResult - Completed sprint or battle summary
 * @param {object} context - Extra evaluation metadata (timestamp, etc.)
 */
function evaluateAchievements(user, sessionResult = {}, context = {}) {
  const existingIds = new Set((user.achievements || []).map((a) => a.id));
  const newAchievements = [];

  const timestamp = context.timestamp ? new Date(context.timestamp) : new Date();
  const timezone = user.timezone || 'UTC';
  const localHour = getLocalHour(timestamp, timezone);

  // 1. Night Owl Check (11 PM = 23, 12 AM = 0, 1 AM = 1, 2 AM = 2)
  if (!existingIds.has('NIGHT_OWL')) {
    if (localHour === 23 || localHour === 0 || localHour === 1 || localHour === 2) {
      newAchievements.push(BADGES.NIGHT_OWL);
    }
  }

  // 2. Speed Demon Check (100% accuracy, average speed < 50% par time)
  if (!existingIds.has('SPEED_DEMON')) {
    if (sessionResult.accuracy === 1.0 && sessionResult.totalQuestions >= 5) {
      const avgTimeMs = sessionResult.results?.reduce((sum, r) => sum + (r.timeMs || 0), 0) / (sessionResult.totalQuestions || 1);
      if (avgTimeMs > 0 && avgTimeMs < 12000) {
        newAchievements.push(BADGES.SPEED_DEMON);
      }
    }
  }

  // 3. Streak Milestones
  const currentStreak = user.streak?.current || 0;
  if (!existingIds.has('STREAK_7') && currentStreak >= 7) {
    newAchievements.push(BADGES.STREAK_7);
  }
  if (!existingIds.has('STREAK_30') && currentStreak >= 30) {
    newAchievements.push(BADGES.STREAK_30);
  }

  // 4. Flawless Quant
  if (!existingIds.has('FLAWLESS_QUANT')) {
    if (
      sessionResult.accuracy === 1.0 &&
      sessionResult.results?.every((r) => r.skill === 'quantitative') &&
      sessionResult.totalQuestions >= 5
    ) {
      newAchievements.push(BADGES.FLAWLESS_QUANT);
    }
  }

  // 5. 1v1 Battle Gladiator
  if (!existingIds.has('GLADIATOR_10')) {
    const wins = user.battleStats?.wins || 0;
    if (wins >= 10) {
      newAchievements.push(BADGES.GLADIATOR_10);
    }
  }

  return newAchievements;
}

/**
 * Apply newly earned achievements to the user and reward gems.
 */
async function awardAchievements(user, newBadges) {
  if (!newBadges || newBadges.length === 0) return [];

  let totalGemsEarned = 0;

  for (const badge of newBadges) {
    user.achievements.push({
      id: badge.id,
      unlockedAt: new Date(),
      title: badge.title,
      description: badge.description,
      icon: badge.icon,
      gemReward: badge.gemReward,
    });

    totalGemsEarned += badge.gemReward || 0;
  }

  if (totalGemsEarned > 0) {
    user.gems = (user.gems || 0) + totalGemsEarned;
    await GemTransaction.create({
      userId: user._id,
      delta: totalGemsEarned,
      reason: 'ACHIEVEMENT',
      refId: newBadges.map((b) => b.id).join(','),
      balanceAfter: user.gems,
    });
  }

  await user.save();
  return newBadges;
}

module.exports = {
  BADGES,
  getLocalHour,
  evaluateAchievements,
  awardAchievements,
};
