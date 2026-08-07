const express = require('express');
const router = express.Router();
const User = require('../models/User');
const gamification = require('../services/gamification');

/**
 * GET /api/leaderboard
 * Fetch the current weekly leaderboard for the user's league.
 * leagueId is no longer stored on the User — it's managed via Redis only.
 */
router.get('/api/leaderboard', async (req, res, next) => {
  try {
    // League assignment is Redis-only — derive from userId
    const leagueId = await gamification.getOrAssignLeague(req.userId);

    // Fetch top entries from Redis
    const redisEntries = await gamification.getLeaderboard(leagueId);

    // Calculate reset date (Next Monday 00:00:00 UTC)
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setUTCDate(now.getUTCDate() + ((1 + 7 - now.getUTCDay()) % 7 || 7));
    nextMonday.setUTCHours(0, 0, 0, 0);

    // Populate display names
    const userIds = redisEntries.map(e => e.userId);
    const users = await User.find({ _id: { $in: userIds } }, 'displayName xpTotal');
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u;
    });

    const entries = redisEntries.map((e, index) => {
      const u = userMap[e.userId] || {};
      return {
        rank: index + 1,
        userId: e.userId,
        name: u.displayName || 'Anonymous',
        xp: e.totalXp,
      };
    });

    res.json({
      leagueId,
      resetDate: nextMonday.toISOString(),
      leaderboard: entries,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
