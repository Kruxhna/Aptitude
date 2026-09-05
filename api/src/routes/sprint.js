const express = require('express');
const router = express.Router();
const { User, Question, QuizSession, Friend, GemTransaction } = require('../models');
const engineClient = require('../services/engineClient');
const redisClient = require('../config/redis');
const { scoreAnswer } = require('../utils/scorer');
const gamification = require('../services/gamification');
const leagueService = require('../services/leagueService');
const { getSprintModeConfig } = require('../config/sprintModes');
const { enqueueJob, JOB_TYPES } = require('../config/queue');
const { sprintSubmitLimiter } = require('../middleware/rateLimiter');
const { requireIdempotency } = require('../middleware/idempotency');

const VALID_SPRINT_TYPES = new Set(['quick', 'standard', 'deep']);
const VALID_MODES = new Set(['learn', 'test', 'battle']);

/**
 * GET /api/sprint
 * Generate a new sprint of questions for the current user.
 */
router.get('/api/sprint', async (req, res, next) => {
  try {
    const type = VALID_SPRINT_TYPES.has(req.query.type) ? req.query.type : 'standard';
    const mode = VALID_MODES.has(req.query.mode) ? req.query.mode : 'test';
    const modeConfig = getSprintModeConfig(mode);

    let questionCount = 10;
    if (type === 'quick') questionCount = 5;
    else if (type === 'deep') questionCount = 15;

    // 1. Fetch user
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 2. Call adaptive engine if in test mode, or fetch standard distribution for learn mode
    let questions = [];

    if (modeConfig.updateElo) {
      const engineResponse = await engineClient.calculateNext(
        req.userId.toString(),
        user.elo,
        questionCount
      );

      if (engineResponse.questionIds && engineResponse.questionIds.length > 0) {
        questions = await Question.find({ _id: { $in: engineResponse.questionIds } });
      }
    }

    if (questions.length === 0) {
      questions = await Question.aggregate([
        { $match: { active: true } },
        { $sample: { size: questionCount } },
      ]);
    }

    // 3. Shape question payload based on mode configuration
    const shapedQuestions = questions.map((q) => {
      const base = {
        _id: q._id,
        id: q._id,
        text: q.text,
        type: q.type,
        skill: q.skill,
        difficulty: q.difficulty,
        options: q.options,
        imageOptions: q.imageOptions,
        imagePath: q.imagePath,
        parTimeSeconds: q.parTimeSeconds || 30,
      };

      if (modeConfig.includeScaffolding) {
        base.strategyTip = q.strategyTip || null;
        base.tipDuration = q.tipDuration || 3;
        base.tipAnimation = q.tipAnimation || 'springIn';
        base.hintLevels = q.hintLevels || null;
        base.wrongAnswerExplanations = q.wrongAnswerExplanations
          ? Object.fromEntries(q.wrongAnswerExplanations)
          : null;
        base.conceptId = q.conceptId || null;
      }

      return base;
    });

    const sprintId = `sprint_${req.userId}_${Date.now()}`;
    const sessionData = {
      userId: req.userId.toString(),
      questionIds: questions.map((q) => q._id.toString()),
      sprintType: type,
      mode,
      nodeId: req.query.nodeId || null,
      createdAt: Date.now(),
    };

    // Store in Redis (30-minute expiry)
    await redisClient.set(`sprint:${sprintId}`, JSON.stringify(sessionData), 'EX', 1800);

    res.json({
      sprintId,
      type,
      mode,
      questionCount: shapedQuestions.length,
      questions: shapedQuestions,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/sprint/submit
 * Submit sprint responses and evaluate stats, XP, streaks, and async achievements.
 */
router.post(
  '/api/sprint/submit',
  sprintSubmitLimiter,
  requireIdempotency(86400),
  async (req, res, next) => {
    try {
      const { sprintId, responses } = req.body;

      if (!sprintId) return res.status(400).json({ error: 'Missing sprintId' });
      if (!responses || !Array.isArray(responses) || responses.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty responses array' });
      }

      // 1. Verify Redis session
      const sessionDataStr = await redisClient.get(`sprint:${sprintId}`);
      if (!sessionDataStr) {
        return res.status(409).json({ error: 'Sprint session expired or already submitted' });
      }
      await redisClient.del(`sprint:${sprintId}`);

      const sessionData = JSON.parse(sessionDataStr);
      if (sessionData.userId !== req.userId.toString()) {
        return res.status(403).json({ error: 'Unauthorized sprint session' });
      }

      const mode = sessionData.mode || 'test';
      const modeConfig = getSprintModeConfig(mode);

      // Verify responses only contain questions from this sprint
      const sessionQuestionIds = new Set(sessionData.questionIds);
      if (responses.some((r) => !sessionQuestionIds.has(r.questionId))) {
        return res.status(400).json({ error: 'Responses contain questions not in this sprint session' });
      }

      // 2. Fetch user
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      // 3. Fetch questions, score answers
      const questionIds = responses.map((r) => r.questionId);
      const questions = await Question.find({ _id: { $in: questionIds } });
      const questionMap = {};
      questions.forEach((q) => {
        questionMap[q._id.toString()] = q;
      });

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
          strategyTip: modeConfig.includeScaffolding ? q.strategyTip || null : undefined,
          wrongAnswerExplanations:
            modeConfig.includeScaffolding && !correct && q.wrongAnswerExplanations
              ? Object.fromEntries(q.wrongAnswerExplanations)
              : undefined,
        });

        formattedResponses.push({
          questionId: r.questionId,
          skill: q.skill,
          questionDifficulty: q.difficulty,
          answer: r.answer,
          correct,
          timeMs: r.timeMs,
        });

        bulkOps.push({
          updateOne: {
            filter: { _id: q._id },
            update: { $inc: { timesAnswered: 1, timesCorrect: correct ? 1 : 0 } },
          },
        });
      }

      if (bulkOps.length > 0) await Question.bulkWrite(bulkOps);

      // 4. ELO Rating Calculation
      let eloBefore = { ...user.elo };
      let eloAfter = { ...user.elo };
      let eloDeltas = { verbal: 0, quantitative: 0, logical: 0, spatial: 0 };
      let baseXp = results.filter((r) => r.correct).length * 15;

      if (modeConfig.updateElo) {
        const eloSnapshot = user.elo.toObject ? user.elo.toObject() : { ...user.elo };
        const engineResponse = await engineClient.updateRating(
          req.userId.toString(),
          formattedResponses,
          eloSnapshot,
          0
        );

        eloAfter = engineResponse.newRatings || eloBefore;
        baseXp = engineResponse.xpEarned || baseXp;

        for (const skill of ['verbal', 'quantitative', 'logical', 'spatial']) {
          eloDeltas[skill] = Math.round((eloAfter[skill] || 1000) - (eloBefore[skill] || 1000));
        }

        user.elo = eloAfter;
      }

      // 5. XP Calculation with Boosts
      let xpMultiplier = modeConfig.xpMultiplier;

      // Check active double XP boosts
      const now = new Date();
      const hasDoubleXp = (user.activeBoosts || []).some(
        (b) => b.boostType === 'DOUBLE_XP' && new Date(b.expiresAt) > now
      );
      if (hasDoubleXp) {
        xpMultiplier *= 2.0;
      }

      const xpEarned = Math.round(baseXp * xpMultiplier);

      // Streak Updates
      const streakUpdates = gamification.calculateStreakUpdates(user);
      user.streak.current = streakUpdates['streak.current'];
      user.streak.freezesAvailable = streakUpdates['streak.freezesAvailable'];
      user.streak.lastCompletedUTCDate = streakUpdates['streak.lastCompletedUTCDate'];

      user.xpTotal = (user.xpTotal || 0) + xpEarned;
      user.weeklyXP = (user.weeklyXP || 0) + xpEarned;

      // Leaderboard Updates
      const leagueId = await gamification.getOrAssignLeague(req.userId);
      await gamification.updateRedisLeaderboard(req.userId, leagueId, xpEarned);

      // 6. Summary metrics
      const totalQuestions = results.length;
      const totalCorrect = results.filter((r) => r.correct).length;
      const accuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
      const timeTotalMs = responses.reduce((acc, r) => acc + (r.timeMs || 0), 0);

      // Path Node Progress Update
      const activeNodeId = sessionData.nodeId || req.body.nodeId;
      if (activeNodeId) {
        if (!user.pathProgress) user.pathProgress = [];
        const nodeState = accuracy >= 0.9 ? 'PERFECT' : 'COMPLETED';
        const existingIdx = user.pathProgress.findIndex((p) => p.nodeId === activeNodeId);

        if (existingIdx >= 0) {
          user.pathProgress[existingIdx].accuracy = Math.max(user.pathProgress[existingIdx].accuracy || 0, accuracy);
          if (nodeState === 'PERFECT') user.pathProgress[existingIdx].state = 'PERFECT';
          user.pathProgress[existingIdx].completedAt = new Date();
          user.pathProgress[existingIdx].timesCompleted = (user.pathProgress[existingIdx].timesCompleted || 1) + 1;
        } else {
          user.pathProgress.push({
            nodeId: activeNodeId,
            state: nodeState,
            accuracy,
            completedAt: new Date(),
            timesCompleted: 1,
          });
        }
      }

      await user.save();

      // 7. Async Evaluation Pipeline via BullMQ Queue (Phase 0/2 Architecture)
      enqueueJob(JOB_TYPES.ACHIEVEMENT_EVAL, {
        userId: user._id.toString(),
        sessionResult: {
          accuracy,
          totalQuestions,
          totalCorrect,
          results,
        },
        context: {
          timestamp: new Date(),
        },
      });

      // Save Quiz Session Document
      await QuizSession.create({
        userId: req.userId,
        sprintType: sessionData.sprintType || 'standard',
        mode,
        questionsAnswered: totalQuestions,
        accuracy,
        xpEarned,
        eloDelta: eloDeltas,
        streakCount: user.streak.current,
        timeTotalMs,
        createdAt: new Date(),
      });

      res.json({
        message: 'Sprint evaluated successfully',
        mode,
        accuracy,
        totalCorrect,
        totalQuestions,
        xpEarned,
        xpMultiplier,
        xpTotal: user.xpTotal,
        streak: {
          current: user.streak.current,
          freezesAvailable: user.streak.freezesAvailable,
          freezeUsed: streakUpdates.freezeUsed,
        },
        eloBefore,
        eloAfter,
        eloDeltas,
        ratingDeltas: eloDeltas,
        results,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
