const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { User, QuizSession } = require('../models');

const SKILLS = ['verbal', 'quantitative', 'logical', 'spatial'];
const ELO_MIN = 800;
const ELO_MAX = 1400;

/**
 * Normalize an ELO rating to a 0–100 display score (D-43).
 */
function normalizeElo(elo) {
  return Math.min(100, Math.max(0, Math.round((elo - ELO_MIN) / (ELO_MAX - ELO_MIN) * 100)));
}

/**
 * GET /api/analytics/progress
 * Returns current per-skill ELO ratings normalized to 0–100. (ANLT-01)
 */
router.get('/api/analytics/progress', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const skills = {};
    SKILLS.forEach(skill => {
      const elo = (user.ratings && user.ratings[skill]) || 1000;
      skills[skill] = {
        elo,
        score: normalizeElo(elo),
      };
    });

    res.json({
      userId: req.userId,
      skills,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/history
 * Returns 30-day daily aggregated accuracy, speed, and ELO trends per skill. (ANLT-02)
 * Response format: { history: { verbal: [{ date, accuracy, avgSpeed, rating }], ... } }
 */
router.get('/api/analytics/history', async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

    const sessions = await QuizSession.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.userId),
          completedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $addFields: {
          utcDate: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: 'UTC' },
          },
          questionCount: { $size: { $ifNull: ['$responses', []] } },
        },
      },
      {
        $group: {
          _id: '$utcDate',
          avgAccuracy: { $avg: '$accuracy' },
          // Avg ms per question across sessions that day
          avgSpeedPerQ: {
            $avg: {
              $cond: [
                { $gt: ['$questionCount', 0] },
                { $divide: ['$totalTimeMs', '$questionCount'] },
                0,
              ],
            },
          },
          avgVerbal: { $avg: '$ratingsAfter.verbal' },
          avgQuantitative: { $avg: '$ratingsAfter.quantitative' },
          avgLogical: { $avg: '$ratingsAfter.logical' },
          avgSpatial: { $avg: '$ratingsAfter.spatial' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Shape into per-skill arrays
    const history = {};
    SKILLS.forEach(skill => {
      history[skill] = sessions.map(s => ({
        date: s._id,
        accuracy: Math.round((s.avgAccuracy || 0) * 100) / 100,
        avgSpeed: Math.round(s.avgSpeedPerQ || 0),
        rating: Math.round(s[`avg${skill.charAt(0).toUpperCase() + skill.slice(1)}`] || 1000),
      }));
    });

    res.json({ history });
  } catch (error) {
    next(error);
  }
});

module.exports = { router, normalizeElo };
