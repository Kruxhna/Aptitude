const redisClient = require('../config/redis');

/**
 * Get ISO Year and Week string (e.g. "2026_30") for a given date in UTC.
 */
function getUtcWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Sunday=7, Monday=1)
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}_${weekNo}`;
}

/**
 * Calculate difference in days between two dates in UTC.
 */
function getUtcDayDiff(date1, date2) {
  const utc1 = Date.UTC(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate());
  const utc2 = Date.UTC(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate());
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate updated streak properties for a user based on current date.
 */
function calculateStreakUpdates(user, currentDate = new Date()) {
  let currentStreak = user.currentStreak || 0;
  let longestStreak = user.longestStreak || 0;
  let streakFreezeAvailable = user.streakFreezeAvailable ?? true;
  let streakFreezeUsed = false;

  if (!user.lastSprintDate) {
    currentStreak = 1;
    longestStreak = Math.max(longestStreak, 1);
  } else {
    const dayDiff = getUtcDayDiff(new Date(user.lastSprintDate), currentDate);
    if (dayDiff === 0) {
      // Same day
      if (currentStreak === 0) {
        currentStreak = 1;
        longestStreak = Math.max(longestStreak, 1);
      }
    } else if (dayDiff === 1) {
      // Next day, increment streak
      currentStreak = (currentStreak === 0 ? 1 : currentStreak + 1);
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (dayDiff === 2) {
      // Missed 1 day
      if (streakFreezeAvailable) {
        streakFreezeAvailable = false;
        streakFreezeUsed = true;
        // Streak stays preserved
      } else {
        currentStreak = 1;
      }
    } else {
      // Missed more than 1 day
      currentStreak = 1;
    }
  }

  return {
    currentStreak,
    longestStreak,
    streakFreezeAvailable,
    streakFreezeUsed,
    lastSprintDate: currentDate,
  };
}

/**
 * Get or assign a league ID for a user.
 */
async function getOrAssignLeague(userId, existingLeagueId) {
  if (existingLeagueId) return existingLeagueId;
  const weekKey = getUtcWeekKey();
  
  // Find an active league with < 50 users or create a new league ID
  const activeLeagueKey = `active_league:${weekKey}`;
  let leagueId = await redisClient.get(activeLeagueKey);
  
  if (!leagueId) {
    leagueId = `league_${weekKey}_1`;
    await redisClient.set(activeLeagueKey, leagueId);
  }

  const memberCount = await redisClient.zcard ? await redisClient.zcard(`leaderboard:${weekKey}:${leagueId}`) : 0;
  if (memberCount >= 50) {
    const leagueNum = parseInt(leagueId.split('_').pop() || '1', 10) + 1;
    leagueId = `league_${weekKey}_${leagueNum}`;
    await redisClient.set(activeLeagueKey, leagueId);
  }

  return leagueId;
}

/**
 * Update user score in Redis leaderboard.
 */
async function updateRedisLeaderboard(userId, leagueId, xpEarned) {
  const weekKey = getUtcWeekKey();
  const redisKey = `leaderboard:${weekKey}:${leagueId}`;
  
  if (redisClient.zincrby) {
    await redisClient.zincrby(redisKey, xpEarned, userId.toString());
  } else {
    // Fallback if client is Mock client without zincrby
    const currentScore = parseFloat(await redisClient.get(`${redisKey}:${userId}`) || '0');
    const newScore = currentScore + xpEarned;
    await redisClient.set(`${redisKey}:${userId}`, newScore.toString());
  }
}

/**
 * Retrieve top 50 users from Redis leaderboard.
 */
async function getLeaderboard(leagueId) {
  const weekKey = getUtcWeekKey();
  const redisKey = `leaderboard:${weekKey}:${leagueId}`;
  
  if (redisClient.zrevrange) {
    const raw = await redisClient.zrevrange(redisKey, 0, 49, 'WITHSCORES');
    const results = [];
    for (let i = 0; i < raw.length; i += 2) {
      results.push({ userId: raw[i], totalXp: parseFloat(raw[i + 1]) });
    }
    return results;
  }
  return [];
}

module.exports = {
  getUtcWeekKey,
  getUtcDayDiff,
  calculateStreakUpdates,
  getOrAssignLeague,
  updateRedisLeaderboard,
  getLeaderboard,
};
