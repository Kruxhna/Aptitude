const express = require('express');
const router = express.Router();

/**
 * GET /api/leaderboard
 * Fetch the current weekly leaderboard.
 */
router.get('/api/leaderboard', async (req, res, next) => {
  try {
    // Determine next Monday at 00:00:00 UTC
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setUTCDate(now.getUTCDate() + ((1 + 7 - now.getUTCDay()) % 7 || 7));
    nextMonday.setUTCHours(0, 0, 0, 0);

    // Stub response — Real implementation using Redis Sorted Sets in Phase 5
    res.json({
      entries: [],
      resetDate: nextMonday.toISOString(),
      message: 'Leaderboard route — stub',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
