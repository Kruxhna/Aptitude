const express = require('express');
const router = express.Router();
const { User, Question } = require('../models');
const engineClient = require('../services/engineClient');
const redisClient = require('../services/redisClient');

/**
 * GET /api/sprint
 * Generate a new sprint of questions for the current user.
 * Query params: type (quick|standard|deep, default: standard)
 */
router.get('/api/sprint', async (req, res, next) => {
  try {
    const type = req.query.type || 'standard';
    
    let questionCount = 10;
    if (type === 'quick') questionCount = 5;
    else if (type === 'deep') questionCount = 15;

    // 1. Fetch user to get current ratings
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Call adaptive engine
    const engineResponse = await engineClient.calculateNext(
      req.userId.toString(),
      user.ratings,
      questionCount
    );

    let questions = [];

    // 3. Fetch questions based on engine response, or fallback to random
    if (engineResponse.questionIds && engineResponse.questionIds.length > 0) {
      questions = await Question.find({ _id: { $in: engineResponse.questionIds } });
    } else {
      // Fallback for v1 stub: return random questions
      questions = await Question.aggregate([
        { $match: { active: true } },
        { $sample: { size: questionCount } }
      ]);
    }

    const sprintId = `sprint_${req.userId}_${Date.now()}`;
    const sessionData = {
      userId: req.userId.toString(),
      questionIds: questions.map(q => q._id.toString()),
      createdAt: Date.now()
    };

    // Store in Redis with a 30-minute expiration (1800 seconds)
    await redisClient.set(`sprint:${sprintId}`, JSON.stringify(sessionData), 'EX', 1800);

    res.json({
      sprintId,
      type,
      questionCount: questions.length,
      questions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sprint/submit
 * Submit sprint responses and update user ratings.
 * Body: { responses: [{ questionId, answer, timeMs }] }
 */
router.post('/api/sprint/submit', async (req, res, next) => {
  try {
    const { responses } = req.body;
    
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty responses array' });
    }

    // 1. Fetch user for current ratings and session info
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Fetch questions to enrich responses with skill and difficulty
    const questionIds = responses.map(r => r.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = {};
    questions.forEach(q => {
      questionMap[q._id.toString()] = q;
    });

    // We pass correct: true as a placeholder since full scoring logic is in Phase 4
    const formattedResponses = responses.map(r => {
      const q = questionMap[r.questionId];
      return {
        ...r,
        correct: true, // Stub for now
        skill: q ? q.skill : 'verbal',
        questionDifficulty: q ? q.difficulty : 1000,
      };
    });

    // 3. Call engine to update ratings
    const engineResponse = await engineClient.updateRating(
      req.userId.toString(),
      formattedResponses,
      user.ratings,
      user.sessionsCompleted || 0
    );

    // 4. Return stub results (will update MongoDB in Phase 4)
    res.json({
      message: 'Sprint submitted successfully (stub)',
      accuracy: 0,
      xpEarned: engineResponse.xpEarned || 0,
      ratingsAfter: engineResponse.newRatings || {},
      results: [],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
