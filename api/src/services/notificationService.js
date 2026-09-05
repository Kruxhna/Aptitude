const axios = require('axios');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send batch push notifications via Expo Push API
 * @param {Array<{ to: string, title: string, body: string, data?: object }>} messages
 */
async function sendExpoPushNotifications(messages) {
  if (!messages || messages.length === 0) return { success: true, count: 0 };

  const validMessages = messages.filter((m) => m.to && m.to.startsWith('ExponentPushToken'));

  if (validMessages.length === 0) {
    console.log(`[NotificationService] No valid ExponentPushTokens found in ${messages.length} messages.`);
    return { success: true, count: 0 };
  }

  try {
    const response = await axios.post(EXPO_PUSH_URL, validMessages, {
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });

    console.log(`✓ [NotificationService] Sent ${validMessages.length} push notifications:`, response.data);
    return { success: true, count: validMessages.length, data: response.data };
  } catch (err) {
    console.error('✗ [NotificationService] Error sending push notifications:', err.response?.data || err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send a League Relegation warning to a user
 */
async function sendLeagueRelegationWarning(pushTokens, { currentLeague, rank }) {
  const messages = (pushTokens || []).map((token) => ({
    to: token,
    sound: 'default',
    title: '⚠️ Danger of Relegation!',
    body: `You are currently rank #${rank} in the ${currentLeague} League. Complete today's sprint to secure your tier before Sunday reset!`,
    data: { screen: 'leaderboard' },
  }));

  return await sendExpoPushNotifications(messages);
}

/**
 * Send a Decayed Skill refresher prompt to a user
 */
async function sendDecayedSkillPrompt(pushTokens, { topicName }) {
  const messages = (pushTokens || []).map((token) => ({
    to: token,
    sound: 'default',
    title: '🧠 Skill Memory Decay Alert',
    body: `Your memory retention for "${topicName || 'Aptitude'}" is fading. Take a quick 3-minute refresher sprint!`,
    data: { screen: 'path' },
  }));

  return await sendExpoPushNotifications(messages);
}

module.exports = {
  sendExpoPushNotifications,
  sendLeagueRelegationWarning,
  sendDecayedSkillPrompt,
};
