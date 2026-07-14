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
      name: user.name,
      email: user.email,
      ratings: user.ratings,
      totalXp: user.totalXp,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      streakFreezeAvailable: user.streakFreezeAvailable,
      lastSprintDate: user.lastSprintDate,
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
      ratings: user.ratings,
      sessionsCompleted: user.sessionsCompleted,
      // More stats will be added in Phase 5
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
