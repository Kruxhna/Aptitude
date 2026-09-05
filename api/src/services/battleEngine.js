const { Server } = require('socket.io');
const mongoose = require('mongoose');
const redisClient = require('../config/redis');
const { User, Question, GemTransaction } = require('../models');
const engineClient = require('./engineClient');
const { enqueueJob, JOB_TYPES } = require('../config/queue');

// Active live battle sessions in memory
const activeBattles = new Map();
// Matchmaking pool in memory / Redis: { socketId, userId, elo, queuedAt, timer }
const matchmakingPool = new Map();

const MATCHMAKING_INTERVAL_MS = 2000;
const FORFEIT_TIMEOUT_MS = 15000; // 15s forfeit on disconnect

let ioInstance = null;

/**
 * Initialize Socket.IO 1v1 Battle Server
 */
function initBattleEngine(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  ioInstance.on('connection', (socket) => {
    socket.on('battle:join_queue', async (data) => {
      await handleJoinQueue(socket, data);
    });

    socket.on('battle:leave_queue', () => {
      handleLeaveQueue(socket);
    });

    socket.on('battle:submit_answer', async (data) => {
      await handleAnswerSubmit(socket, data);
    });

    socket.on('disconnect', () => {
      handleDisconnect(socket);
    });
  });

  // Start matchmaking loop
  if (matchmakingInterval) clearInterval(matchmakingInterval);
  matchmakingInterval = setInterval(processMatchmaking, MATCHMAKING_INTERVAL_MS);
  if (matchmakingInterval.unref) matchmakingInterval.unref();
  console.log('✓ BattleEngine: Real-time 1v1 Socket.IO server initialized');
}

let matchmakingInterval = null;

/**
 * Enqueue user into matchmaking pool
 */
async function handleJoinQueue(socket, data = {}) {
  const userId = data.userId || socket.handshake.query.userId;
  if (!userId) return socket.emit('battle:error', { message: 'User ID required' });

  try {
    const user = await User.findById(userId);
    if (!user) return socket.emit('battle:error', { message: 'User not found' });

    // Average ELO across 4 skills
    const avgElo = Math.round(
      ((user.elo?.verbal || 1000) +
        (user.elo?.quantitative || 1000) +
        (user.elo?.logical || 1000) +
        (user.elo?.spatial || 1000)) /
        4
    );

    matchmakingPool.set(socket.id, {
      socketId: socket.id,
      socket,
      userId: user._id.toString(),
      displayName: user.displayName,
      elo: avgElo,
      costume: user.mascot?.activeCostume || 'DEFAULT',
      queuedAt: Date.now(),
    });

    socket.emit('battle:queued', {
      message: 'Searching for an evenly matched opponent...',
      initialElo: avgElo,
    });
  } catch (err) {
    socket.emit('battle:error', { message: err.message });
  }
}

/**
 * Remove user from matchmaking queue
 */
function handleLeaveQueue(socket) {
  matchmakingPool.delete(socket.id);
  socket.emit('battle:dequeued', { message: 'Left matchmaking pool' });
}

/**
 * Matchmaking tick with expanding search radius (±100 -> ±250 -> ±500 at 10s/20s)
 */
async function processMatchmaking() {
  if (matchmakingPool.size < 2) return;

  const entries = Array.from(matchmakingPool.values());
  const pairedSocketIds = new Set();
  const now = Date.now();

  for (let i = 0; i < entries.length; i++) {
    const p1 = entries[i];
    if (pairedSocketIds.has(p1.socketId)) continue;

    const waitSeconds = (now - p1.queuedAt) / 1000;
    // Expanding ELO window
    let maxEloDiff = 100;
    if (waitSeconds > 20) maxEloDiff = 500;
    else if (waitSeconds > 10) maxEloDiff = 250;

    for (let j = i + 1; j < entries.length; j++) {
      const p2 = entries[j];
      if (pairedSocketIds.has(p2.socketId)) continue;
      if (p1.userId === p2.userId) continue; // Don't pair user with self

      const eloDiff = Math.abs(p1.elo - p2.elo);

      if (eloDiff <= maxEloDiff) {
        pairedSocketIds.add(p1.socketId);
        pairedSocketIds.add(p2.socketId);

        matchmakingPool.delete(p1.socketId);
        matchmakingPool.delete(p2.socketId);

        await createBattleSession(p1, p2);
        break;
      }
    }
  }
}

/**
 * Spawn 1v1 battle room and sync initial questions
 */
async function createBattleSession(p1, p2) {
  const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  // Fetch 5 synchronized battle questions
  let questions = [];
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1 && Question && Question.aggregate) {
      questions = await Question.aggregate([
        { $match: { active: true } },
        { $sample: { size: 5 } },
      ]);
    }
  } catch (err) {
    console.warn('[BattleEngine] Question.aggregate fallback:', err.message);
  }

  if (!questions || questions.length === 0) {
    questions = [
      {
        _id: 'bq1',
        text: 'What is 15% of 300?',
        options: ['35', '45', '50', '55'],
        correctAnswer: '45',
        skill: 'quantitative',
        parTimeSeconds: 30,
      },
      {
        _id: 'bq2',
        text: 'Find the odd one out: Apple, Orange, Banana, Carrot',
        options: ['Apple', 'Orange', 'Banana', 'Carrot'],
        correctAnswer: 'Carrot',
        skill: 'verbal',
        parTimeSeconds: 20,
      },
      {
        _id: 'bq3',
        text: 'If A=1, B=2, C=3, what is CAB?',
        options: ['312', '321', '123', '213'],
        correctAnswer: '312',
        skill: 'logical',
        parTimeSeconds: 20,
      },
    ];
  }

  const session = {
    battleId,
    p1: {
      socketId: p1.socketId,
      userId: p1.userId,
      displayName: p1.displayName,
      elo: p1.elo,
      costume: p1.costume,
      score: 0,
      currentQuestionIndex: 0,
      answers: [],
      connected: true,
    },
    p2: {
      socketId: p2.socketId,
      userId: p2.userId,
      displayName: p2.displayName,
      elo: p2.elo,
      costume: p2.costume,
      score: 0,
      currentQuestionIndex: 0,
      answers: [],
      connected: true,
    },
    questions,
    questionStartTime: Date.now(),
    currentQuestionIndex: 0,
    status: 'ACTIVE',
    createdAt: Date.now(),
  };

  activeBattles.set(battleId, session);

  if (typeof p1.socket.join === 'function') p1.socket.join(battleId);
  if (typeof p2.socket.join === 'function') p2.socket.join(battleId);

  // Send matched payload with questions (sanitized without direct correctAnswer exposure)
  const clientQuestions = questions.map((q) => ({
    _id: q._id,
    id: q._id,
    text: q.text,
    options: q.options,
    skill: q.skill,
    parTimeSeconds: q.parTimeSeconds || 30,
  }));

  if (ioInstance) {
    ioInstance.to(battleId).emit('battle:matched', {
      battleId,
      opponent: {
        p1: { displayName: p1.displayName, elo: p1.elo, costume: p1.costume },
        p2: { displayName: p2.displayName, elo: p2.elo, costume: p2.costume },
      },
      totalQuestions: clientQuestions.length,
      questions: clientQuestions,
    });
  }
}

/**
 * Handle answer submission with server-authoritative timestamps
 */
async function handleAnswerSubmit(socket, data) {
  const { battleId, questionIndex, answer } = data;
  const session = activeBattles.get(battleId);
  if (!session || session.status !== 'ACTIVE') return;

  const isP1 = session.p1.socketId === socket.id;
  const isP2 = session.p2.socketId === socket.id;
  if (!isP1 && !isP2) return;

  const player = isP1 ? session.p1 : session.p2;
  const opponent = isP1 ? session.p2 : session.p1;

  const currentQ = session.questions[questionIndex];
  if (!currentQ) return;

  // Server-measured elapsed time
  const serverReceivedTime = Date.now();
  const timeSpentMs = Math.max(100, serverReceivedTime - session.questionStartTime);

  const isCorrect = String(answer).trim() === String(currentQ.correctAnswer).trim();

  // Speed-weighted points: 100 base + remaining time bonus
  const points = isCorrect ? Math.round(100 + Math.max(0, 30000 - timeSpentMs) / 300) : 0;
  player.score += points;

  player.answers.push({
    questionIndex,
    answer,
    isCorrect,
    timeSpentMs,
    points,
  });

  player.currentQuestionIndex = questionIndex + 1;

  // Notify both players of live score update
  ioInstance.to(battleId).emit('battle:score_update', {
    battleId,
    p1Score: session.p1.score,
    p2Score: session.p2.score,
    p1Progress: session.p1.currentQuestionIndex,
    p2Progress: session.p2.currentQuestionIndex,
  });

  // Check if battle is complete
  const totalQ = session.questions.length;
  if (session.p1.currentQuestionIndex >= totalQ && session.p2.currentQuestionIndex >= totalQ) {
    await concludeBattle(session);
  }
}

/**
 * Conclude 1v1 battle, assign gem rewards, and update dual ELO symmetrically
 */
async function concludeBattle(session, forfeitWinnerId = null) {
  session.status = 'COMPLETED';
  const battleId = session.battleId;

  let winner = null;
  let loser = null;
  let isDraw = false;

  if (forfeitWinnerId) {
    if (session.p1.userId === forfeitWinnerId) {
      winner = session.p1;
      loser = session.p2;
    } else {
      winner = session.p2;
      loser = session.p1;
    }
  } else if (session.p1.score > session.p2.score) {
    winner = session.p1;
    loser = session.p2;
  } else if (session.p2.score > session.p1.score) {
    winner = session.p2;
    loser = session.p1;
  } else {
    isDraw = true;
  }

  // Symmetrical ELO calculation (K=32 for battles)
  const p1Expected = 1 / (1 + Math.pow(10, (session.p2.elo - session.p1.elo) / 400));
  const p1Actual = isDraw ? 0.5 : winner === session.p1 ? 1.0 : 0.0;
  const p1EloDelta = Math.round(32 * (p1Actual - p1Expected));
  const p2EloDelta = -p1EloDelta;

  const p1NewElo = session.p1.elo + p1EloDelta;
  const p2NewElo = session.p2.elo + p2EloDelta;

  // Update DB for both users
  try {
    const u1 = await User.findById(session.p1.userId);
    const u2 = await User.findById(session.p2.userId);

    if (u1) {
      if (winner === session.p1) {
        u1.battleStats.wins += 1;
        u1.gems += 25; // 25 Gem reward for winning 1v1 battle
        await GemTransaction.create({
          userId: u1._id,
          delta: 25,
          reason: 'BATTLE_WIN',
          refId: battleId,
          balanceAfter: u1.gems,
        });
      } else if (!isDraw) {
        u1.battleStats.losses += 1;
      }
      u1.battleStats.totalBattles += 1;
      // Spread ELO delta evenly across skills
      const deltaPerSkill = Math.round(p1EloDelta / 4);
      u1.elo.verbal += deltaPerSkill;
      u1.elo.quantitative += deltaPerSkill;
      u1.elo.logical += deltaPerSkill;
      u1.elo.spatial += deltaPerSkill;
      await u1.save();

      // Trigger async achievement check
      enqueueJob(JOB_TYPES.ACHIEVEMENT_EVAL, { userId: u1._id.toString() });
    }

    if (u2) {
      if (winner === session.p2) {
        u2.battleStats.wins += 1;
        u2.gems += 25;
        await GemTransaction.create({
          userId: u2._id,
          delta: 25,
          reason: 'BATTLE_WIN',
          refId: battleId,
          balanceAfter: u2.gems,
        });
      } else if (!isDraw) {
        u2.battleStats.losses += 1;
      }
      u2.battleStats.totalBattles += 1;
      const deltaPerSkill = Math.round(p2EloDelta / 4);
      u2.elo.verbal += deltaPerSkill;
      u2.elo.quantitative += deltaPerSkill;
      u2.elo.logical += deltaPerSkill;
      u2.elo.spatial += deltaPerSkill;
      await u2.save();

      enqueueJob(JOB_TYPES.ACHIEVEMENT_EVAL, { userId: u2._id.toString() });
    }
  } catch (err) {
    console.error('[BattleEngine] Error updating user ratings:', err);
  }

  ioInstance.to(battleId).emit('battle:game_over', {
    battleId,
    isDraw,
    winnerId: winner?.userId || null,
    p1: {
      userId: session.p1.userId,
      displayName: session.p1.displayName,
      score: session.p1.score,
      eloDelta: p1EloDelta,
      newElo: p1NewElo,
      gemsEarned: winner === session.p1 ? 25 : 0,
    },
    p2: {
      userId: session.p2.userId,
      displayName: session.p2.displayName,
      score: session.p2.score,
      eloDelta: p2EloDelta,
      newElo: p2NewElo,
      gemsEarned: winner === session.p2 ? 25 : 0,
    },
  });

  activeBattles.delete(battleId);
}

/**
 * Handle user disconnection with 15s forfeit grace period
 */
function handleDisconnect(socket) {
  matchmakingPool.delete(socket.id);

  // Search active battles
  for (const session of activeBattles.values()) {
    if (session.status !== 'ACTIVE') continue;

    const isP1 = session.p1.socketId === socket.id;
    const isP2 = session.p2.socketId === socket.id;

    if (isP1 || isP2) {
      const disconnectedPlayer = isP1 ? session.p1 : session.p2;
      const remainingPlayer = isP1 ? session.p2 : session.p1;
      disconnectedPlayer.connected = false;

      ioInstance.to(session.battleId).emit('battle:player_disconnected', {
        message: `${disconnectedPlayer.displayName} disconnected. Forfeit timer started (15s).`,
        forfeitTimeoutSeconds: 15,
      });

      // 15-second forfeit timer
      setTimeout(async () => {
        const liveSession = activeBattles.get(session.battleId);
        if (liveSession && liveSession.status === 'ACTIVE' && !disconnectedPlayer.connected) {
          console.log(`[BattleEngine] Player ${disconnectedPlayer.displayName} forfeited due to disconnect timeout.`);
          await concludeBattle(liveSession, remainingPlayer.userId);
        }
      }, FORFEIT_TIMEOUT_MS);
      break;
    }
  }
}

module.exports = {
  initBattleEngine,
  handleJoinQueue,
  handleLeaveQueue,
  processMatchmaking,
  activeBattles,
  matchmakingPool,
};
