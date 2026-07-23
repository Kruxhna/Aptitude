require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const Redis = require('ioredis');

// 1. Configure test environment
process.env.API_PORT = 3001;
process.env.ENGINE_URL = 'http://localhost:8001';
const mongoUri = process.env.LOCAL_MONGO_URI || 'mongodb://localhost:27017/aptitude';
process.env.MONGO_URI = mongoUri;
process.env.REDIS_URL = process.env.LOCAL_REDIS_URL || 'redis://127.0.0.1:6379';
process.env.MOCK_REDIS = 'true';

const MOCK_USER_ID = '000000000000000000000001';

async function run() {
  let mockEngine;
  let redis;

  try {
    console.log('--- Setting up Integration Test Environment ---');

    // 2. Connect to MongoDB locally to seed test data
    console.log(`Connecting to Mongo: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    const { User, Question } = require('../models');

    // Seed mock user if not exists
    let user = await User.findById(MOCK_USER_ID);
    if (!user) {
      user = new User({
        _id: MOCK_USER_ID,
        name: 'Integration Test User',
        email: 'test@example.com',
        ratings: { verbal: 1000, quantitative: 1000, logical: 1000, spatial: 1000 },
        totalXp: 0,
        sessionsCompleted: 0
      });
      await user.save();
      console.log('✓ Seeded mock user');
    }

    // Seed mock questions if none exist
    let questions = await Question.find({ active: true });
    if (questions.length < 2) {
      const q1 = new Question({
        text: 'What is 5 + 5?',
        type: 'numerical',
        skill: 'quantitative',
        difficulty: 1000,
        explanation: '5 + 5 is 10.',
        correctAnswer: 10,
        active: true
      });
      const q2 = new Question({
        text: 'Select the synonym of Fast',
        type: 'mcq',
        skill: 'verbal',
        difficulty: 1000,
        explanation: 'Quick is a synonym of Fast.',
        options: ['Slow', 'Heavy', 'Quick', 'Dark'],
        correctOptionIndex: 2,
        active: true
      });
      await Question.insertMany([q1, q2], { ordered: false }).catch(() => {});
      questions = await Question.find({ active: true });
      console.log('✓ Seeded mock questions');
    }

    const qIds = questions.map(q => q._id.toString());

    // 3. Use canonical Redis config (mocked or real)
    redis = require('../config/redis');
    console.log('✓ Connected to Redis (Proxy)');

    // 4. Start Mock Adaptive Engine Server on Port 8001
    const engineApp = express();
    engineApp.use(express.json());

    engineApp.post('/calculate-next', (req, res) => {
      res.json({
        questionIds: qIds.slice(0, 2),
        message: 'Questions selected successfully',
        requestedCount: req.body.questionCount,
        returnedCount: 2
      });
    });

    engineApp.post('/update-rating', (req, res) => {
      res.json({
        newRatings: { verbal: 1010, quantitative: 1005, logical: 1000, spatial: 1000 },
        xpEarned: 20,
        message: 'Ratings updated successfully'
      });
    });

    mockEngine = engineApp.listen(8001, () => {
      console.log('✓ Mock Adaptive Engine running on port 8001');
    });

    // 5. Start API Server (index.js starts server automatically on 3001)
    console.log('Starting API Gateway server on port 3001...');
    require('../index');

    // Wait a brief moment for Express to listen
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('\n--- Running Integration Tests ---');

    // 6. Test GET /api/sprint
    console.log('Testing GET /api/sprint...');
    const getRes = await axios.get('http://localhost:3001/api/sprint');
    
    if (getRes.status !== 200) {
      throw new Error(`GET /api/sprint failed with status: ${getRes.status}`);
    }
    const { sprintId, questions: returnedQs } = getRes.data;
    if (!sprintId || !returnedQs || returnedQs.length === 0) {
      throw new Error(`GET /api/sprint returned invalid data: ${JSON.stringify(getRes.data)}`);
    }
    console.log(`✓ GET /api/sprint passed (sprintId: ${sprintId})`);

    // Verify Redis key exists
    const redisKeyExists = await redis.exists(`sprint:${sprintId}`);
    if (!redisKeyExists) {
      throw new Error(`Redis key sprint:${sprintId} was not created`);
    }
    console.log('✓ Redis session key created');

    // 7. Test POST /api/sprint/submit
    console.log('Testing POST /api/sprint/submit (Valid)...');
    
    // Construct valid responses matching correct answers from seeded questions
    const responses = returnedQs.map(q => {
      let answer;
      if (q.type === 'numerical') answer = q.correctAnswer;
      else if (q.type === 'mcq') answer = q.correctOptionIndex;
      else if (q.type === 'spatial') answer = q.correctImageIndex;

      return {
        questionId: q._id,
        answer,
        timeMs: 5000
      };
    });

    const submitRes = await axios.post('http://localhost:3001/api/sprint/submit', {
      sprintId,
      responses
    });

    if (submitRes.status !== 200) {
      throw new Error(`POST /api/sprint/submit failed with status: ${submitRes.status}`);
    }

    const { accuracy, totalCorrect, xpEarned, ratingDeltas, streak, leagueId } = submitRes.data;
    if (accuracy !== 1 || totalCorrect !== responses.length || xpEarned !== 20) {
      throw new Error(`Invalid submission results: ${JSON.stringify(submitRes.data)}`);
    }
    if (!streak || streak.currentStreak < 1 || !leagueId) {
      throw new Error(`Missing gamification data in submit response: ${JSON.stringify(submitRes.data)}`);
    }
    console.log(`✓ POST /api/sprint/submit passed (accuracy: ${accuracy}, xpEarned: ${xpEarned}, streak: ${streak.currentStreak}, leagueId: ${leagueId})`);
    console.log(`✓ ELO deltas: ${JSON.stringify(ratingDeltas)}`);

    // 7.5 Test GET /api/leaderboard
    console.log('Testing GET /api/leaderboard...');
    const leaderboardRes = await axios.get('http://localhost:3001/api/leaderboard');
    if (leaderboardRes.status !== 200 || !leaderboardRes.data.leagueId) {
      throw new Error(`GET /api/leaderboard returned invalid data: ${JSON.stringify(leaderboardRes.data)}`);
    }
    console.log(`✓ GET /api/leaderboard passed (leagueId: ${leaderboardRes.data.leagueId})`);

    // Verify Redis key deleted
    const redisKeyDeleted = !(await redis.exists(`sprint:${sprintId}`));
    if (!redisKeyDeleted) {
      throw new Error(`Redis key sprint:${sprintId} was not deleted after submission`);
    }
    console.log('✓ Redis session key deleted successfully');

    // 8. Test double submission prevention
    console.log('Testing double-submission prevention...');
    try {
      await axios.post('http://localhost:3001/api/sprint/submit', {
        sprintId,
        responses
      });
      throw new Error('Double submission succeeded, expected failure');
    } catch (err) {
      if (err.response && err.response.status === 409) {
        console.log('✓ Double-submission prevented with 409 Conflict (passed)');
      } else {
        throw new Error(`Expected 409 Conflict, got: ${err.message}`);
      }
    }

    console.log('\n--- All Integration Tests Passed Successfully! ---');
    cleanup(0);
  } catch (error) {
    console.error('\n✗ Integration Test Failed:', error.message);
    if (error.response) {
      console.error('Response details:', error.response.status, error.response.data);
    }
    cleanup(1);
  }

  function cleanup(exitCode) {
    if (mockEngine) mockEngine.close();
    if (redis) redis.disconnect();
    mongoose.disconnect().then(() => {
      process.exit(exitCode);
    });
  }
}

run();
