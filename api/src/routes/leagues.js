const express = require('express');
const router = express.Router();
const { User } = require('../models');
const leagueService = require('../services/leagueService');

/**
 * GET /api/leagues/current
 * User's current league, weeklyXP, progress to next threshold, and rank.
 */
router.get('/api/leagues/current', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId, 'currentLeague weeklyXP leagueHistory');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tier = user.currentLeague || 'Bronze';
    const threshold = leagueService.LEAGUE_THRESHOLDS[tier];
    const tierIdx = leagueService.tierIndex(tier);

    // Progress toward next tier (if not Titan)
    let nextTier = null;
    let progressPercent = 100;
    if (tierIdx < leagueService.TIER_ORDER.length - 1) {
      nextTier = leagueService.TIER_ORDER[tierIdx + 1];
      const nextMin = leagueService.LEAGUE_THRESHOLDS[nextTier].min;
      const range = nextMin - threshold.min;
      const earned = (user.weeklyXP || 0) - threshold.min;
      progressPercent = Math.min(100, Math.max(0, Math.round((earned / range) * 100)));
    }

    // Get rank within tier
    const rank = await leagueService.getUserRankInLeague(req.userId, tier);

    // Last 4 weeks history
    const recentHistory = (user.leagueHistory || [])
      .slice(-4)
      .reverse()
      .map((h, i, arr) => {
        let change = 'same';
        if (i < arr.length - 1) {
          const prevIdx = leagueService.tierIndex(arr[i + 1].league);
          const curIdx = leagueService.tierIndex(h.league);
          if (curIdx > prevIdx) change = 'promoted';
          else if (curIdx < prevIdx) change = 'demoted';
        }
        return {
          league: h.league,
          weekStart: h.weekStart,
          weekEnd: h.weekEnd,
          change,
        };
      });

    res.json({
      currentLeague: tier,
      weeklyXP: user.weeklyXP || 0,
      nextTier,
      progressPercent,
      threshold,
      rank,
      recentHistory,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/leagues/leaderboard?league=Titan
 * Top 50 users in a specific league tier.
 */
router.get('/api/leagues/leaderboard', async (req, res, next) => {
  try {
    const league = req.query.league || 'Bronze';
    if (!leagueService.TIER_ORDER.includes(league)) {
      return res.status(400).json({ error: `Invalid league tier: ${league}` });
    }

    const entries = await leagueService.getLeagueTierLeaderboard(league);

    // Populate display names
    const userIds = entries.map(e => e.userId);
    const users = await User.find(
      { _id: { $in: userIds } },
      'displayName currentLeague'
    );
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const leaderboard = entries.map((e, index) => {
      const u = userMap[e.userId] || {};
      return {
        rank: index + 1,
        userId: e.userId,
        displayName: u.displayName || 'Anonymous',
        weeklyXP: e.weeklyXP,
        currentLeague: u.currentLeague || league,
        isYou: e.userId === req.userId.toString(),
      };
    });

    res.json({ league, leaderboard });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
