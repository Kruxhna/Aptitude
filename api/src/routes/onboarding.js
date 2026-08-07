const express = require('express');
const router = express.Router();
const { User, PlacementQuestion } = require('../models');
const engineClient = require('../services/engineClient');
const redisClient = require('../config/redis');

// ─── Placement ELO base ────────────────────────────────────────
// Start from 1200 instead of 1000 so placement can calibrate faster
const PLACEMENT_BASE_ELO = 1200;

// ─── Goal → XP mapping ────────────────────────────────────────
const GOAL_XP_MAP = { 10: 25, 20: 50, 30: 75 };

/**
 * GET /api/onboarding/status
 * Returns per-step onboarding completion flags.
 */
router.get('/api/onboarding/status', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      placementCompleted: user.placementCompleted || false,
      goalsSet: user.dailyGoal !== 20 || user.dailyXPTarget !== 50, // true if changed from defaults
      onboardingCompleted: user.onboardingCompleted || false,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/onboarding/placement/start
 * Create a placement test session in Redis (30 min TTL).
 */
router.post('/api/onboarding/placement/start', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.placementCompleted) {
      return res.status(409).json({ error: 'Placement test already completed' });
    }

    // Fetch all placement questions
    const questions = await PlacementQuestion.find({ isPlacement: true });
    if (questions.length === 0) {
      return res.status(500).json({ error: 'No placement questions seeded. Run seedPlacement.js first.' });
    }

    const sessionId = `placement_${req.userId}_${Date.now()}`;
    const sessionData = {
      userId: req.userId.toString(),
      questionIds: questions.map(q => q._id.toString()),
      createdAt: Date.now(),
    };

    await redisClient.set(`placement:${sessionId}`, JSON.stringify(sessionData), 'EX', 1800);

    res.json({ sessionId });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/onboarding/placement/questions
 * Returns placement questions (without correct answers).
 */
router.get('/api/onboarding/placement/questions', async (req, res, next) => {
  try {
    const questions = await PlacementQuestion.find({ isPlacement: true }).select('-correctIndex');

    res.json({
      questions: questions.map(q => ({
        id: q._id,
        skill: q.skill,
        prompt: q.prompt,
        options: q.options,
        difficulty: q.difficulty,
      })),
      totalCount: questions.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/onboarding/placement/submit
 * Score placement answers, call ELO engine with base 1200, persist initial ELOs.
 * Body: { sessionId, answers: [{ questionId, selectedIndex }] }
 */
router.post('/api/onboarding/placement/submit', async (req, res, next) => {
  try {
    const { sessionId, answers } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty answers array' });
    }

    // 1. Verify Redis session
    const sessionStr = await redisClient.get(`placement:${sessionId}`);
    if (!sessionStr) {
      return res.status(409).json({ error: 'Placement session expired or already submitted' });
    }
    await redisClient.del(`placement:${sessionId}`);

    const sessionData = JSON.parse(sessionStr);
    if (sessionData.userId !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized placement session' });
    }

    // 2. Fetch questions and score
    const questions = await PlacementQuestion.find({
      _id: { $in: sessionData.questionIds },
    });
    const questionMap = {};
    questions.forEach(q => { questionMap[q._id.toString()] = q; });

    const formattedResponses = [];
    const skillBreakdown = {};

    for (const ans of answers) {
      const q = questionMap[ans.questionId];
      if (!q) continue;

      const correct = ans.selectedIndex === q.correctIndex;
      formattedResponses.push({
        questionId: ans.questionId,
        skill: q.skill === 'mixed' ? 'quantitative' : q.skill, // map mixed → quantitative for ELO
        questionDifficulty: q.difficulty * 200, // scale 1-10 → ~200-2000 ELO equivalent
        answer: ans.selectedIndex,
        correct,
        timeMs: ans.timeMs || 30000, // default 30s if not provided
      });

      skillBreakdown[q.skill] = {
        correct,
        prompt: q.prompt.substring(0, 80),
      };
    }

    // 3. Call engine with elevated base ratings
    const placementRatings = {
      verbal: PLACEMENT_BASE_ELO,
      quantitative: PLACEMENT_BASE_ELO,
      logical: PLACEMENT_BASE_ELO,
      spatial: PLACEMENT_BASE_ELO,
    };

    let newRatings = placementRatings;
    try {
      const engineResponse = await engineClient.updateRating(
        req.userId.toString(),
        formattedResponses,
        placementRatings,
        0, // sessionsCompleted = 0 for placement
      );
      newRatings = engineResponse.newRatings || placementRatings;
    } catch (engineErr) {
      // If engine is down, fall back: correct answers → +50, wrong → -50
      console.warn('Engine unavailable for placement, using fallback ELO:', engineErr.message);
      for (const resp of formattedResponses) {
        const skill = resp.skill;
        if (newRatings[skill] !== undefined) {
          newRatings[skill] += resp.correct ? 50 : -50;
        }
      }
    }

    // 4. Persist to user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.elo = newRatings;
    user.placementCompleted = true;
    await user.save();

    res.json({
      message: 'Placement test completed',
      initialElo: newRatings,
      skillBreakdown,
      totalCorrect: formattedResponses.filter(r => r.correct).length,
      totalQuestions: formattedResponses.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/onboarding/goals
 * Save daily goal settings.
 * Body: { dailyGoal: 10 | 20 | 30 }
 */
router.post('/api/onboarding/goals', async (req, res, next) => {
  try {
    const { dailyGoal } = req.body;

    if (![10, 20, 30].includes(dailyGoal)) {
      return res.status(400).json({ error: 'dailyGoal must be 10, 20, or 30' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.dailyGoal = dailyGoal;
    user.dailyXPTarget = GOAL_XP_MAP[dailyGoal] || 50;
    await user.save();

    res.json({
      ok: true,
      dailyGoal: user.dailyGoal,
      dailyXPTarget: user.dailyXPTarget,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/onboarding/tutorial/complete
 * Mark onboarding as fully completed.
 */
router.patch('/api/onboarding/tutorial/complete', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.onboardingCompleted = true;
    await user.save();

    res.json({ ok: true, onboardingCompleted: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
