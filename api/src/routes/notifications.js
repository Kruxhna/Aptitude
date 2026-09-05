const express = require('express');
const router = express.Router();
const { User } = require('../models');

/**
 * POST /api/notifications/register-token
 * Register device's Expo push token for server-side push notifications.
 */
router.post('/api/notifications/register-token', async (req, res, next) => {
  try {
    const { pushToken } = req.body;
    if (!pushToken || typeof pushToken !== 'string') {
      return res.status(400).json({ error: 'Valid pushToken string is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.pushTokens) {
      user.pushTokens = [];
    }

    if (!user.pushTokens.includes(pushToken)) {
      user.pushTokens.push(pushToken);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Push token registered successfully',
      tokenCount: user.pushTokens.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/notifications/unregister-token
 * Unregister a device's push token upon signout or permission revocation.
 */
router.delete('/api/notifications/unregister-token', async (req, res, next) => {
  try {
    const { pushToken } = req.body;
    if (!pushToken) {
      return res.status(400).json({ error: 'pushToken is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.pushTokens = (user.pushTokens || []).filter((t) => t !== pushToken);
    await user.save();

    res.json({
      success: true,
      message: 'Push token unregistered successfully',
      tokenCount: user.pushTokens.length,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
