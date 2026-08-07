const express = require('express');
const router = express.Router();
const { User } = require('../models');

/**
 * GET /api/users/me
 * Fetch current user profile.
 */
router.get('/api/users/me', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      displayName: user.displayName,
      elo: user.elo,
      xpTotal: user.xpTotal,
      streak: {
        current: user.streak.current,
        freezesAvailable: user.streak.freezesAvailable,
        lastCompletedUTCDate: user.streak.lastCompletedUTCDate,
      },
      learnModeStats: user.learnModeStats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/stats
 * Fetch user analytics data.
 */
router.get('/api/users/stats', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      elo: user.elo,
      xpTotal: user.xpTotal,
      streak: user.streak,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
