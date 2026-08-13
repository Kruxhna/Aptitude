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

/**
 * GET /api/users/preferences
 * Fetch user preferences for haptics/sound/accessibility.
 */
router.get('/api/users/preferences', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      preferences: {
        hapticsEnabled: user.preferences?.hapticsEnabled ?? true,
        soundEnabled: user.preferences?.soundEnabled ?? true,
        soundVolume: user.preferences?.soundVolume ?? 70,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/preferences
 * Update one or more user preferences.
 * Body: { hapticsEnabled?: boolean, soundEnabled?: boolean, soundVolume?: number }
 */
router.put('/api/users/preferences', async (req, res, next) => {
  try {
    const { hapticsEnabled, soundEnabled, soundVolume } = req.body;

    const updates = {};

    if (typeof hapticsEnabled === 'boolean') {
      updates['preferences.hapticsEnabled'] = hapticsEnabled;
    }
    if (typeof soundEnabled === 'boolean') {
      updates['preferences.soundEnabled'] = soundEnabled;
    }
    if (typeof soundVolume === 'number' && soundVolume >= 0 && soundVolume <= 100) {
      updates['preferences.soundVolume'] = Math.round(soundVolume);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid preference fields provided' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      preferences: {
        hapticsEnabled: user.preferences.hapticsEnabled,
        soundEnabled: user.preferences.soundEnabled,
        soundVolume: user.preferences.soundVolume,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
