const express = require('express');
const router = express.Router();
const { User, Question, QuizSession, Friend } = require('../models');
const engineClient = require('../services/engineClient');
const redisClient = require('../config/redis');
const { scoreAnswer } = require('../utils/scorer');
const gamification = require('../services/gamification');
const leagueService = require('../services/leagueService');

const VALID_SPRINT_TYPES = new Set(['quick', 'standard', 'deep']);
const VALID_MODES = new Set(['learn', 'test']);

/**
 * GET /api/sprint
 * Generate a new sprint of questions for the current user.
 * Query params:
 *   type  — quick | standard | deep (default: standard)
 *   mode  — learn | test (default: test)
 *
 * In learn mode, strategy tips, hint levels, and wrong-answer explanations
 * are included in the question payload. In test mode they are stripped.
 */
router.get('/api/sprint', async (req, res, next) => {
  try {
    const type = VALID_SPRINT_TYPES.has(req.query.type) ? req.query.type : 'standard';
    const mode = VALID_MODES.has(req.query.mode) ? req.query.mode : 'test';

    let questionCount = 10;
    if (type === 'quick') questionCount = 5;
    else if (type === 'deep') questionCount = 15;

    // 1. Fetch user
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 2. Call adaptive engine using canonical elo field
    const engineResponse = await engineClient.calculateNext(
      req.userId.toString(),
      user.elo,
      questionCount
    );

    let questions = [];

    // 3. Fetch questions based on engine response, or fallback to random
    if (engineResponse.questionIds && engineResponse.questionIds.length > 0) {
      questions = await Question.find({ _id: { $in: engineResponse.questionIds } });
    } else {
      questions = await Question.aggregate([
        { $match: { active: true } },
        { $sample: { size: questionCount } },
      ]);
    }

    // 4. Shape question payload based on mode
    const shapedQuestions = questions.map(q => {
      const base = {
        _id: q._id,
        text: q.text,
        type: q.type,
        skill: q.skill,
        difficulty: q.difficulty,
        options: q.options,
        imageOptions: q.imageOptions,
        imagePath: q.imagePath,
        parTimeSeconds: q.parTimeSeconds || 30,
      };

      if (mode === 'learn') {
        // Include all learning scaffolding fields
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
      questionIds: questions.map(q => q._id.toString()),
      sprintType: type,
      mode,
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

    // Verify responses only contain questions from this sprint
    const sessionQuestionIds = new Set(sessionData.questionIds);
    if (responses.some(r => !sessionQuestionIds.has(r.questionId))) {
      return res.status(400).json({ error: 'Responses contain questions not in this sprint session' });
    }

    // 2. Fetch user using canonical elo field
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 3. Fetch questions, score answers
    const questionIds = responses.map(r => r.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = {};
    questions.forEach(q => { questionMap[q._id.toString()] = q; });

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
        // Include learning content for feedback
        strategyTip: mode === 'learn' ? (q.strategyTip || null) : undefined,
        wrongAnswerExplanations: mode === 'learn' && !correct && q.wrongAnswerExplanations
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

    // 4. Call engine — pass K-factor override for learn mode (K=16 flat vs dynamic K=20–40)
    const eloSnapshot = user.elo.toObject ? user.elo.toObject() : { ...user.elo };
    const engineResponse = await engineClient.updateRating(
      req.userId.toString(),
      formattedResponses,
      eloSnapshot,
      0, // sessionsCompleted — no longer tracked on User
      mode === 'learn' ? 16 : undefined // kFactorOverride
    );

    // 5. Apply XP (0.5x in learn mode) and streak updates
    const baseXp = engineResponse.xpEarned || 0;
    const xpEarned = mode === 'learn' ? Math.round(baseXp * 0.5) : baseXp;

    const streakUpdates = gamification.calculateStreakUpdates(user);

    // Write streak sub-fields using dot-notation keys from streakUpdates
    user.streak.current = streakUpdates['streak.current'];
    user.streak.freezesAvailable = streakUpdates['streak.freezesAvailable'];
    user.streak.lastCompletedUTCDate = streakUpdates['streak.lastCompletedUTCDate'];

    user.elo = engineResponse.newRatings;
    user.xpTotal = (user.xpTotal || 0) + xpEarned;
    user.weeklyXP = (user.weeklyXP || 0) + xpEarned;

    // Leaderboard — league is Redis-only (existing global leaderboard)
    const leagueId = await gamification.getOrAssignLeague(req.userId);
    await gamification.updateRedisLeaderboard(req.userId, leagueId, xpEarned);

    // Social leaderboards — fire-and-forget
    setImmediate(async () => {
      try {
        // Update league-tier ZSET
        const tier = user.currentLeague || 'Bronze';
        await leagueService.updateLeagueZSET(req.userId, tier, xpEarned);

        // Update friend leaderboards — find accepted friend IDs
        const friendDocs = await Friend.find({
          $or: [
            { userId: req.userId, status: 'accepted' },
            { friendId: req.userId, status: 'accepted' },
          ],
        }, 'userId friendId');
        const friendIds = friendDocs.map(f =>
          f.userId.toString() === req.userId.toString() ? f.friendId : f.userId
        );
        await leagueService.updateFriendLeaderboards(req.userId, friendIds, xpEarned);
      } catch (err) {
        console.warn('[Sprint] Social leaderboard update failed:', err.message);
      }
    });

    // 6. Summary metrics
    const totalQuestions = results.length;
    const totalCorrect = results.filter(r => r.correct).length;
    const accuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
    const timeTotalMs = responses.reduce((acc, r) => acc + (r.timeMs || 0), 0);

    const ratingDeltas = {};
    ['verbal', 'quantitative', 'logical', 'spatial'].forEach(skill => {
      const before = eloSnapshot[skill] || 1000;
      const after = engineResponse.newRatings[skill] || 1000;
      ratingDeltas[skill] = Math.round(after - before);
    });

    // Fire-and-forget: persist user + QuizSession
    setImmediate(() => {
      user.save().catch(err => console.error('Background Mongo user sync error:', err.message));

      const quizSession = new QuizSession({
        userId: req.userId,
        sprintType: sessionData.sprintType || 'standard',
        responses: results.map(r => ({
          questionId: r.questionId,
          answer: r.userAnswer,
          correct: r.correct,
          timeMs: r.timeMs,
        })),
        accuracy,
        totalTimeMs: timeTotalMs,
        xpEarned,
        ratingsAfter: engineResponse.newRatings,
        completedAt: new Date(),
      });
      quizSession.save().catch(err => console.error('QuizSession save error:', err.message));
    });

    res.json({
      message: 'Sprint submitted successfully',
      mode,
      accuracy,
      totalCorrect,
      totalQuestions,
      xpEarned,
      xpMultiplier: mode === 'learn' ? 0.5 : 1.0,
      xpTotal: user.xpTotal,
      streak: {
        current: user.streak.current,
        freezesAvailable: user.streak.freezesAvailable,
        freezeUsed: streakUpdates.freezeUsed,
      },
      leagueId,
      timeTotalMs,
      eloBefore: eloSnapshot,
      eloAfter: engineResponse.newRatings,
      eloDeltas: ratingDeltas,
      results,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
