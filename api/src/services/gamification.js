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
 * Reads and writes user.streak.* sub-fields per the canonical schema.
 */
function calculateStreakUpdates(user, currentDate = new Date()) {
  const streak = user.streak || {};
  let current = streak.current || 0;
  let freezesAvailable = streak.freezesAvailable ?? 1;
  let freezeUsed = false;

  const lastDateStr = streak.lastCompletedUTCDate; // "YYYY-MM-DD" or null

  if (!lastDateStr) {
    // First ever sprint
    current = 1;
  } else {
    // Parse the stored UTC date string into a Date for diff calculation
    const lastDate = new Date(`${lastDateStr}T00:00:00Z`);
    const dayDiff = getUtcDayDiff(lastDate, currentDate);

    if (dayDiff === 0) {
      // Same UTC day — streak already counted, just ensure ≥ 1
      if (current === 0) current = 1;
    } else if (dayDiff === 1) {
      // Consecutive day
      current = (current === 0 ? 1 : current + 1);
    } else if (dayDiff === 2) {
      // Missed exactly 1 day — use freeze if available
      if (freezesAvailable > 0) {
        freezesAvailable -= 1;
        freezeUsed = true;
        // Streak preserved, still increment for today
        current = (current === 0 ? 1 : current + 1);
      } else {
        current = 1;
      }
    } else {
      // Missed 2+ days
      current = 1;
    }
  }

  const todayUTC = currentDate.toISOString().slice(0, 10); // "YYYY-MM-DD"

  return {
    // Values to write back to user.streak.*
    'streak.current': current,
    'streak.freezesAvailable': freezesAvailable,
    'streak.lastCompletedUTCDate': todayUTC,
    // Extra metadata for response
    freezeUsed,
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
