/**
 * Spaced Repetition Memory Decay Engine
 *
 * Formula:
 *   S = BASE_STABILITY * (1 + accuracyBonus)
 *   accuracyBonus = clamp((historicalAccuracy - 0.5) * 2, -0.5, 1.5)
 *   R = e^(-Δt / S)
 *
 * A node with R < 0.70 is flagged as 'REVIEW' to prompt refresher practice.
 */

const BASE_STABILITY_DAYS = 14.0; // Base half-life retention of 14 days
const DECAY_THRESHOLD_REVIEW = 0.70; // Transition to REVIEW state below 70% retention
const NOTIFICATION_DECAY_THRESHOLD = 0.60; // Proactive push trigger below 60% retention

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate memory stability S (in days).
 * @param {number} historicalAccuracy - Historical accuracy between 0.0 and 1.0
 * @param {number} baseStability - Base stability constant in days
 */
function calculateStability(historicalAccuracy = 1.0, baseStability = BASE_STABILITY_DAYS) {
  const accuracyBonus = clamp((historicalAccuracy - 0.5) * 2.0, -0.5, 1.5);
  return baseStability * (1.0 + accuracyBonus);
}

/**
 * Calculate retention probability R (0.0 - 1.0).
 * @param {number} deltaDays - Elapsed days since last completion
 * @param {number} stability - Stability S in days
 */
function calculateRetention(deltaDays, stability) {
  if (deltaDays <= 0) return 1.0;
  if (stability <= 0) return 0.0;
  return Math.exp(-deltaDays / stability);
}

/**
 * Lazy compute decay for a user's path progress items.
 * Transforms stale COMPLETED/PERFECT nodes into REVIEW on read without batch database writes.
 */
function applyLazyDecay(pathProgress = [], now = new Date()) {
  return pathProgress.map((item) => {
    const completedAt = item.completedAt ? new Date(item.completedAt) : now;
    const deltaDays = Math.max(0, (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24));

    const accuracy = item.accuracy ?? 1.0;
    const stability = calculateStability(accuracy);
    const retention = calculateRetention(deltaDays, stability);

    let effectiveState = item.state;
    if (retention < DECAY_THRESHOLD_REVIEW && (item.state === 'COMPLETED' || item.state === 'PERFECT')) {
      effectiveState = 'REVIEW';
    }

    return {
      nodeId: item.nodeId,
      state: effectiveState,
      originalState: item.state,
      accuracy,
      completedAt: item.completedAt,
      retention: parseFloat(retention.toFixed(3)),
      deltaDays: parseFloat(deltaDays.toFixed(1)),
      stability: parseFloat(stability.toFixed(1)),
    };
  });
}

/**
 * Lightweight scheduled scan to find users with critically decayed skills
 * and trigger remote push notifications.
 */
async function scanUsersForDecayedSkills(UserModel, now = new Date()) {
  const usersWithProgress = await UserModel.find(
    { 'pathProgress.0': { $exists: true }, pushTokens: { $exists: true, $not: { $size: 0 } } },
    { _id: 1, displayName: 1, pathProgress: 1, pushTokens: 1 }
  );

  const notificationCandidates = [];

  for (const user of usersWithProgress) {
    const decayedNodes = [];

    for (const p of user.pathProgress) {
      if (p.state === 'COMPLETED' || p.state === 'PERFECT' || p.state === 'REVIEW') {
        const completedAt = p.completedAt ? new Date(p.completedAt) : now;
        const deltaDays = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24);
        const stability = calculateStability(p.accuracy ?? 1.0);
        const retention = calculateRetention(deltaDays, stability);

        if (retention < NOTIFICATION_DECAY_THRESHOLD) {
          decayedNodes.push({ nodeId: p.nodeId, retention });
        }
      }
    }

    if (decayedNodes.length > 0) {
      notificationCandidates.push({
        userId: user._id,
        pushTokens: user.pushTokens,
        displayName: user.displayName,
        decayedNodeCount: decayedNodes.length,
        mostDecayedNode: decayedNodes[0].nodeId,
      });
    }
  }

  return notificationCandidates;
}

module.exports = {
  BASE_STABILITY_DAYS,
  DECAY_THRESHOLD_REVIEW,
  NOTIFICATION_DECAY_THRESHOLD,
  calculateStability,
  calculateRetention,
  applyLazyDecay,
  scanUsersForDecayedSkills,
};
