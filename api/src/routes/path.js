const express = require('express');
const router = express.Router();
const { User, QuizSession } = require('../models');

// ─── GATE Aptitude Master DAG Topology ───────────────────────────
// Position: normalized x in [0, 1] relative to viewport width, y = sequential vertical step index
const PATH_TOPOLOGY = [
  {
    id: 'node-1',
    skill: 'QUANTITATIVE',
    topic: 'Algebra & Ratios',
    description: 'Master linear equations, proportions, and algebraic expressions.',
    questionCount: 5,
    estimatedMinutes: 4,
    eloRequirement: 1000,
    xpReward: 35,
    isBranch: false,
    position: { x: 0.50, y: 0 },
  },
  {
    id: 'node-2',
    skill: 'VERBAL',
    topic: 'Vocabulary & Synonyms',
    description: 'Build core word power, contextual antonyms, and verbal clarity.',
    questionCount: 5,
    estimatedMinutes: 3,
    eloRequirement: 1020,
    xpReward: 30,
    isBranch: false,
    position: { x: 0.64, y: 1 },
  },
  {
    id: 'node-2-branch-spatial',
    skill: 'SPATIAL',
    topic: '2D Rotations & Mirrors',
    description: 'Visualize planar rotations, reflections, and mirror symmetry.',
    questionCount: 5,
    estimatedMinutes: 4,
    eloRequirement: 1050,
    xpReward: 40,
    isBranch: true,
    branchParentId: 'node-2',
    mergeTargetId: 'node-3',
    position: { x: 0.18, y: 1.8 },
  },
  {
    id: 'node-3',
    skill: 'LOGICAL',
    topic: 'Deductive Syllogisms',
    description: 'Analyze premises, Venn deductions, and valid conclusions.',
    questionCount: 5,
    estimatedMinutes: 5,
    eloRequirement: 1060,
    xpReward: 45,
    isBranch: false,
    position: { x: 0.46, y: 2.6 },
  },
  {
    id: 'node-4',
    skill: 'QUANTITATIVE',
    topic: 'Percentages & Profit',
    description: 'Solve discounts, markup ratios, and compounded changes.',
    questionCount: 5,
    estimatedMinutes: 4,
    eloRequirement: 1080,
    xpReward: 35,
    isBranch: false,
    position: { x: 0.36, y: 3.6 },
  },
  {
    id: 'node-4-branch-verbal',
    skill: 'VERBAL',
    topic: 'Grammar & Error Spotting',
    description: 'Sentence correction, subject-verb agreement, and prepositions.',
    questionCount: 5,
    estimatedMinutes: 3,
    eloRequirement: 1100,
    xpReward: 35,
    isBranch: true,
    branchParentId: 'node-4',
    mergeTargetId: 'node-5',
    position: { x: 0.82, y: 4.4 },
  },
  {
    id: 'node-5',
    skill: 'SPATIAL',
    topic: 'Paper Folding & Cuts',
    description: 'Trace punch patterns, symmetrical unfolds, and crease layouts.',
    questionCount: 5,
    estimatedMinutes: 4,
    eloRequirement: 1120,
    xpReward: 40,
    isBranch: false,
    position: { x: 0.52, y: 5.2 },
  },
  {
    id: 'node-6',
    skill: 'LOGICAL',
    topic: 'Blood Relations & Order',
    description: 'Map family trees, hierarchy ranks, and linear sequencing.',
    questionCount: 5,
    estimatedMinutes: 4,
    eloRequirement: 1140,
    xpReward: 40,
    isBranch: false,
    position: { x: 0.64, y: 6.2 },
  },
  {
    id: 'node-6-branch-quant',
    skill: 'QUANTITATIVE',
    topic: 'Speed, Time & Distance',
    description: 'Relative speed, trains, circular tracks, and boat streams.',
    questionCount: 5,
    estimatedMinutes: 5,
    eloRequirement: 1160,
    xpReward: 50,
    isBranch: true,
    branchParentId: 'node-6',
    mergeTargetId: 'node-7',
    position: { x: 0.18, y: 7.0 },
  },
  {
    id: 'node-7',
    skill: 'VERBAL',
    topic: 'Reading Comprehension',
    description: 'Passage inference, central themes, and tone evaluation.',
    questionCount: 5,
    estimatedMinutes: 5,
    eloRequirement: 1180,
    xpReward: 45,
    isBranch: false,
    position: { x: 0.50, y: 7.8 },
  },
  {
    id: 'node-8',
    skill: 'QUANTITATIVE',
    topic: 'Data Interpretation',
    description: 'Bar graphs, pie charts, tabular analysis, and trend forecasting.',
    questionCount: 5,
    estimatedMinutes: 5,
    eloRequirement: 1200,
    xpReward: 50,
    isBranch: false,
    position: { x: 0.36, y: 8.8 },
  },
  {
    id: 'node-9',
    skill: 'LOGICAL',
    topic: 'Seating Arrangements',
    description: 'Circular tables, multi-variable constraints, and matrix grids.',
    questionCount: 5,
    estimatedMinutes: 5,
    eloRequirement: 1220,
    xpReward: 50,
    isBranch: false,
    position: { x: 0.52, y: 9.8 },
  },
  {
    id: 'node-10',
    skill: 'SPATIAL',
    topic: '3D Cube & Block Projections',
    description: 'Orthographic projections, painted cubes, and isometric views.',
    questionCount: 5,
    estimatedMinutes: 4,
    eloRequirement: 1250,
    xpReward: 45,
    isBranch: false,
    position: { x: 0.64, y: 10.8 },
  },
  {
    id: 'node-11',
    skill: 'QUANTITATIVE',
    topic: 'Probability & Combinatorics',
    description: 'Permutations, combinations, conditional probability, and Bayes.',
    questionCount: 5,
    estimatedMinutes: 5,
    eloRequirement: 1280,
    xpReward: 55,
    isBranch: false,
    position: { x: 0.50, y: 11.8 },
  },
  {
    id: 'node-12',
    skill: 'QUANTITATIVE',
    topic: 'GATE Mastery Sprint',
    description: 'Grand comprehensive challenge across all 4 aptitude sections.',
    questionCount: 10,
    estimatedMinutes: 8,
    eloRequirement: 1300,
    xpReward: 100,
    isBranch: false,
    position: { x: 0.40, y: 12.8 },
  },
];

// ─── Decay Threshold: 5 days in ms ──────────────────────────────
const DECAY_THRESHOLD_MS = 5 * 24 * 60 * 60 * 1000;

/**
 * Helper to calculate user's node states across the DAG.
 */
function computeNodeStates(topology, userProgress, userElo) {
  const progressMap = new Map();
  if (Array.isArray(userProgress)) {
    userProgress.forEach((p) => {
      progressMap.set(p.nodeId, p);
    });
  }

  // If new user with no progress, default first 2 nodes as completed for rich demonstration if configured,
  // or default to clean progression starting at node-1.
  const now = Date.now();
  let currentFound = false;

  return topology.map((item, index) => {
    const progress = progressMap.get(item.id);
    let state = 'LOCKED';
    let accuracy = progress ? progress.accuracy : null;
    let completedAt = progress ? progress.completedAt : null;

    if (progress) {
      // Check for skill decay
      const timeSinceCompletion = completedAt ? now - new Date(completedAt).getTime() : 0;
      if (timeSinceCompletion > DECAY_THRESHOLD_MS) {
        state = 'REVIEW';
      } else if (progress.accuracy >= 0.90) {
        state = 'PERFECT';
      } else {
        state = 'COMPLETED';
      }
    } else if (!currentFound) {
      // If parent is branch or trunk
      let canUnlock = false;
      if (item.isBranch) {
        // Unlocks if branch parent is completed/perfect/review
        const parentProgress = progressMap.get(item.branchParentId);
        canUnlock = !!parentProgress;
      } else {
        // Main trunk node: unlocks if all previous trunk nodes are completed
        const prevTrunkNodes = topology.slice(0, index).filter((n) => !n.isBranch);
        canUnlock = prevTrunkNodes.every((n) => progressMap.has(n.id));
      }

      if (canUnlock) {
        state = 'CURRENT';
        currentFound = true;
      } else {
        state = 'LOCKED';
      }
    } else {
      state = 'LOCKED';
    }

    return {
      ...item,
      state,
      accuracy,
      completedAt,
    };
  });
}

/**
 * GET /api/path/tree
 * Returns the complete DAG of learning nodes with state, position coordinates, and stats.
 */
router.get('/api/path/tree', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If user has zero progress, seed initial state for demo or fresh experience
    let userProgress = user.pathProgress || [];
    if (userProgress.length === 0) {
      // Default: First node completed with 95% accuracy (PERFECT), second node completed with 80% accuracy (COMPLETED)
      // to immediately demonstrate the visual states on first load!
      userProgress = [
        {
          nodeId: 'node-1',
          state: 'PERFECT',
          accuracy: 1.0,
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          timesCompleted: 1,
        },
        {
          nodeId: 'node-2',
          state: 'COMPLETED',
          accuracy: 0.8,
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          timesCompleted: 1,
        },
      ];
      user.pathProgress = userProgress;
      await user.save().catch(() => {});
    }

    const computedNodes = computeNodeStates(PATH_TOPOLOGY, userProgress, user.elo);

    const completedCount = computedNodes.filter(
      (n) => n.state === 'COMPLETED' || n.state === 'PERFECT' || n.state === 'REVIEW'
    ).length;
    const currentNode = computedNodes.find((n) => n.state === 'CURRENT') || computedNodes[0];

    res.json({
      nodes: computedNodes,
      stats: {
        totalNodes: computedNodes.length,
        completedCount,
        progressPercent: Math.round((completedCount / computedNodes.length) * 100),
        currentNodeId: currentNode?.id || 'node-1',
        currentTopic: currentNode?.topic || 'Algebra & Ratios',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/path/complete
 * Records completion of a path node.
 * Body: { nodeId, accuracy: number, score: number }
 */
router.post('/api/path/complete', async (req, res, next) => {
  try {
    const { nodeId, accuracy = 1.0 } = req.body;
    if (!nodeId) {
      return res.status(400).json({ error: 'nodeId is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const state = accuracy >= 0.90 ? 'PERFECT' : 'COMPLETED';

    if (!user.pathProgress) {
      user.pathProgress = [];
    }

    const existingIndex = user.pathProgress.findIndex((p) => p.nodeId === nodeId);
    if (existingIndex >= 0) {
      user.pathProgress[existingIndex].state = state;
      user.pathProgress[existingIndex].accuracy = accuracy;
      user.pathProgress[existingIndex].completedAt = new Date();
      user.pathProgress[existingIndex].timesCompleted = (user.pathProgress[existingIndex].timesCompleted || 1) + 1;
    } else {
      user.pathProgress.push({
        nodeId,
        state,
        accuracy,
        completedAt: new Date(),
        timesCompleted: 1,
      });
    }

    await user.save();

    const computedNodes = computeNodeStates(PATH_TOPOLOGY, user.pathProgress, user.elo);
    res.json({
      message: 'Node completed successfully',
      nodeId,
      state,
      nodes: computedNodes,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
