const { JOB_TYPES, registerJobHandler } = require('../config/queue');
const { User } = require('../models');
const { evaluateAchievements, awardAchievements } = require('./achievementEngine');
const { scanUsersForDecayedSkills } = require('./decayEngine');
const { sendExpoPushNotifications, sendDecayedSkillPrompt, sendLeagueRelegationWarning } = require('./notificationService');

/**
 * Register all async worker handlers for BullMQ
 */
function initWorkerHandlers() {
  // 1. Achievement Evaluation Worker
  registerJobHandler(JOB_TYPES.ACHIEVEMENT_EVAL, async (payload, meta) => {
    const { userId, sessionResult, context } = payload;
    if (!userId) return;

    const user = await User.findById(userId);
    if (!user) return;

    const newBadges = evaluateAchievements(user, sessionResult || {}, context || {});
    if (newBadges.length > 0) {
      await awardAchievements(user, newBadges);
      console.log(`✓ [Worker] Awarded ${newBadges.length} achievements to user ${user.displayName}:`, newBadges.map((b) => b.title));
    }
  });

  // 2. Scheduled Decay Scan Worker
  registerJobHandler(JOB_TYPES.DECAY_SCAN, async (payload) => {
    console.log('[Worker] Running scheduled skill decay scan...');
    const candidates = await scanUsersForDecayedSkills(User);

    for (const candidate of candidates) {
      await sendDecayedSkillPrompt(candidate.pushTokens, { topicName: candidate.mostDecayedNode });
    }

    console.log(`✓ [Worker] Decay scan completed. Notified ${candidates.length} users.`);
    return { notifiedCount: candidates.length };
  });

  // 3. Notification Dispatch Worker
  registerJobHandler(JOB_TYPES.NOTIFICATION_DISPATCH, async (payload) => {
    const { messages, type, pushTokens, data } = payload;

    if (type === 'LEAGUE_RELEGATION') {
      return await sendLeagueRelegationWarning(pushTokens, data);
    } else if (type === 'DECAYED_SKILL') {
      return await sendDecayedSkillPrompt(pushTokens, data);
    } else if (messages) {
      return await sendExpoPushNotifications(messages);
    }
  });

  console.log('✓ WorkerHandlers: All BullMQ job handlers registered');
}

module.exports = {
  initWorkerHandlers,
};
