const redisClient = require('../config/redis');
const User = require('../models/User');
const LeagueHistory = require('../models/LeagueHistory');

/**
 * League tier thresholds — weekly XP required to be IN that tier.
 * Promotion happens when weeklyXP > current tier max.
 * Demotion happens when weeklyXP < current tier min.
 */
const LEAGUE_THRESHOLDS = {
  Bronze:   { min: 0,   max: 50 },
  Silver:   { min: 51,  max: 150 },
  Gold:     { min: 151, max: 300 },
  Platinum: { min: 301, max: 500 },
  Diamond:  { min: 501, max: 800 },
  Titan:    { min: 801, max: Infinity },
};

const TIER_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Titan'];

/**
 * Determine the correct league tier for a given weeklyXP value.
 */
function computeTierForXP(weeklyXP) {
  for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
    const tier = TIER_ORDER[i];
    if (weeklyXP >= LEAGUE_THRESHOLDS[tier].min) {
      return tier;
    }
  }
  return 'Bronze';
}

/**
 * Get tier index (0 = Bronze, 5 = Titan)
 */
function tierIndex(tier) {
  return TIER_ORDER.indexOf(tier);
}

/**
 * Update the league-tier ZSET when a user earns XP.
 * Called after every XP award (sprint submit, battle win, etc).
 *
 * Redis key: `league:{tierName}` — ZSET of userId → weeklyXP
 */
async function updateLeagueZSET(userId, currentLeague, xpEarned) {
  try {
    const redisKey = `league:${currentLeague}`;
    if (redisClient.zincrby) {
      await redisClient.zincrby(redisKey, xpEarned, userId.toString());
    }
  } catch (err) {
    console.warn('[LeagueService] updateLeagueZSET failed:', err.message);
  }
}

/**
 * Update all of a user's friends' friend_leaderboard ZSETs.
 * Called after every XP award.
 *
 * Redis key: `friend_leaderboard:{friendUserId}` — ZSET of friendId → weeklyXP
 */
async function updateFriendLeaderboards(userId, friendIds, xpEarned) {
  try {
    if (!redisClient.zincrby || !friendIds?.length) return;

    const pipeline = redisClient.pipeline ? redisClient.pipeline() : null;
    for (const friendId of friendIds) {
      const key = `friend_leaderboard:${friendId.toString()}`;
      if (pipeline) {
        pipeline.zincrby(key, xpEarned, userId.toString());
      } else {
        await redisClient.zincrby(key, xpEarned, userId.toString());
      }
    }
    // Also update user's own friend leaderboard (so they see themselves)
    const ownKey = `friend_leaderboard:${userId.toString()}`;
    if (pipeline) {
      pipeline.zincrby(ownKey, xpEarned, userId.toString());
      await pipeline.exec();
    } else {
      await redisClient.zincrby(ownKey, xpEarned, userId.toString());
    }
  } catch (err) {
    console.warn('[LeagueService] updateFriendLeaderboards failed:', err.message);
  }
}

/**
 * Get friend leaderboard from Redis.
 * Returns sorted array of { userId, weeklyXP }.
 */
async function getFriendLeaderboard(userId) {
  try {
    const key = `friend_leaderboard:${userId.toString()}`;
    if (!redisClient.zrevrange) return [];

    const raw = await redisClient.zrevrange(key, 0, 49, 'WITHSCORES');
    const results = [];
    for (let i = 0; i < raw.length; i += 2) {
      results.push({ userId: raw[i], weeklyXP: parseFloat(raw[i + 1]) });
    }
    return results;
  } catch (err) {
    console.warn('[LeagueService] getFriendLeaderboard failed:', err.message);
    return [];
  }
}

/**
 * Get league tier leaderboard — top 50 in a specific tier.
 */
async function getLeagueTierLeaderboard(tierName) {
  try {
    const key = `league:${tierName}`;
    if (!redisClient.zrevrange) return [];

    const raw = await redisClient.zrevrange(key, 0, 49, 'WITHSCORES');
    const results = [];
    for (let i = 0; i < raw.length; i += 2) {
      results.push({ userId: raw[i], weeklyXP: parseFloat(raw[i + 1]) });
    }
    return results;
  } catch (err) {
    console.warn('[LeagueService] getLeagueTierLeaderboard failed:', err.message);
    return [];
  }
}

/**
 * Get a user's rank within their league tier ZSET (0-indexed).
 * Returns null if not found.
 */
async function getUserRankInLeague(userId, tierName) {
  try {
    const key = `league:${tierName}`;
    if (!redisClient.zrevrank) return null;
    const rank = await redisClient.zrevrank(key, userId.toString());
    return rank !== null && rank !== undefined ? rank + 1 : null; // 1-indexed
  } catch {
    return null;
  }
}

/**
 * Weekly league recomputation — called by cron (Sunday 00:00 UTC).
 *
 * For each user:
 *   1. Determine new tier from weeklyXP
 *   2. Write LeagueHistory document
 *   3. Update User.currentLeague and push to User.leagueHistory
 *   4. Reset weeklyXP to 0
 *   5. Move user between league:{tier} ZSETs
 *   6. Reset friend_leaderboard ZSETs
 */
async function weeklyLeagueReset() {
  const now = new Date();
  const weekEnd = new Date(now);
  const weekStart = new Date(now);
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);

  // Process all users with any weekly activity
  const cursor = User.find({ weeklyXP: { $gt: 0 } }).cursor();

  for await (const user of cursor) {
    const oldTier = user.currentLeague || 'Bronze';
    const newTier = computeTierForXP(user.weeklyXP);
    const promoted = tierIndex(newTier) > tierIndex(oldTier);
    const demoted = tierIndex(newTier) < tierIndex(oldTier);

    // 1. Write analytics-grade history
    await LeagueHistory.create({
      userId: user._id,
      league: newTier,
      weeklyXP: user.weeklyXP,
      weekStart,
      weekEnd,
      promoted,
      demoted,
    });

    // 2. Update user document
    await User.findByIdAndUpdate(user._id, {
      $set: { currentLeague: newTier, weeklyXP: 0 },
      $push: {
        leagueHistory: {
          $each: [{ league: newTier, weekStart, weekEnd }],
          $slice: -12, // Keep last 12 weeks
        },
      },
    });

    // 3. Move between league ZSETs
    try {
      if (oldTier !== newTier && redisClient.zrem) {
        await redisClient.zrem(`league:${oldTier}`, user._id.toString());
      }
      // Reset score in new tier ZSET to 0 for fresh week
      if (redisClient.zadd) {
        await redisClient.zadd(`league:${newTier}`, 0, user._id.toString());
      }
    } catch { /* Redis optional */ }
  }

  // 4. Clear all friend_leaderboard keys (they'll repopulate during the new week)
  // In production, use SCAN with pattern matching; for now, this is handled
  // by the TTL strategy or manual clear.
  console.log('[LeagueService] Weekly league reset completed');
}

module.exports = {
  LEAGUE_THRESHOLDS,
  TIER_ORDER,
  computeTierForXP,
  tierIndex,
  updateLeagueZSET,
  updateFriendLeaderboards,
  getFriendLeaderboard,
  getLeagueTierLeaderboard,
  getUserRankInLeague,
  weeklyLeagueReset,
};
