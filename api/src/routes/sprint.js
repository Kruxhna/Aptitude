const express = require('express');
const router = express.Router();
const { User, Question } = require('../models');
const engineClient = require('../services/engineClient');
const redisClient = require('../services/redisClient');
const { scoreAnswer } = require('../utils/scorer');

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
 * Body: { sprintId, responses: [{ questionId, answer, timeMs }] }
 */
router.post('/api/sprint/submit', async (req, res, next) => {
  try {
    const { sprintId, responses } = req.body;
    
    if (!sprintId) {
      return res.status(400).json({ error: 'Missing sprintId' });
    }

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty responses array' });
    }

    // 1. Redis session verification
    const sessionDataStr = await redisClient.get(`sprint:${sprintId}`);
    if (!sessionDataStr) {
      return res.status(409).json({ error: 'Sprint session expired or already submitted' });
    }

    // Delete session immediately to prevent double-submission
    await redisClient.del(`sprint:${sprintId}`);

    const sessionData = JSON.parse(sessionDataStr);
    if (sessionData.userId !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized sprint session' });
    }

    // Verify responses contain only the questions in this sprint session
    const sessionQuestionIds = new Set(sessionData.questionIds);
    const invalidQuestion = responses.some(r => !sessionQuestionIds.has(r.questionId));
    if (invalidQuestion) {
      return res.status(400).json({ error: 'Responses contain questions not in this sprint session' });
    }

    // 2. Fetch user for current ratings and session info
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 3. Fetch questions to score and enrich responses
    const questionIds = responses.map(r => r.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = {};
    questions.forEach(q => {
      questionMap[q._id.toString()] = q;
    });

    // Score answers and construct enriched response items for engine and client
    const results = [];
    const formattedResponses = [];
    const bulkOps = [];

    for (const r of responses) {
      const q = questionMap[r.questionId];
      if (!q) continue;

      const { correct, correctAnswer } = scoreAnswer(q, r.answer);

      results.push({
        questionId: r.questionId,
        correct,
        userAnswer: r.answer,
        correctAnswer,
        explanation: q.explanation,
        timeMs: r.timeMs,
        skill: q.skill,
      });

      formattedResponses.push({
        questionId: r.questionId,
        skill: q.skill,
        questionDifficulty: q.difficulty,
        answer: r.answer,
        correct,
        timeMs: r.timeMs,
      });

      // Prepare question metric updates
      bulkOps.push({
        updateOne: {
          filter: { _id: q._id },
          update: {
            $inc: {
              timesAnswered: 1,
              timesCorrect: correct ? 1 : 0,
            },
          },
        },
      });
    }

    // Execute bulk write to update question metrics
    if (bulkOps.length > 0) {
      await Question.bulkWrite(bulkOps);
    }

    // 4. Call engine to update ratings
    const ratingsBefore = { ...user.ratings.toObject() };
    const engineResponse = await engineClient.updateRating(
      req.userId.toString(),
      formattedResponses,
      user.ratings,
      user.sessionsCompleted || 0
    );

    // 5. Update user document in MongoDB
    user.ratings = engineResponse.newRatings;
    user.totalXp += engineResponse.xpEarned;
    user.sessionsCompleted = (user.sessionsCompleted || 0) + 1;
    user.lastSprintDate = new Date();
    await user.save();

    // 6. Calculate summary metrics
    const totalQuestions = results.length;
    const totalCorrect = results.filter(r => r.correct).length;
    const accuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
    const timeTotalMs = responses.reduce((acc, r) => acc + (r.timeMs || 0), 0);

    // Calculate rating deltas
    const ratingDeltas = {};
    const skills = ['verbal', 'quantitative', 'logical', 'spatial'];
    skills.forEach(skill => {
      const before = ratingsBefore[skill] || 1000;
      const after = engineResponse.newRatings[skill] || 1000;
      ratingDeltas[skill] = Math.round(after - before);
    });

    res.json({
      message: 'Sprint submitted successfully',
      accuracy,
      totalCorrect,
      totalQuestions,
      xpEarned: engineResponse.xpEarned || 0,
      timeTotalMs,
      ratingsBefore,
      ratingsAfter: engineResponse.newRatings,
      ratingDeltas,
      results,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
