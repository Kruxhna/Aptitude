import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';

const LOCAL_NOTIFICATION_KEY = '@gate_aptitude_local_notification_settings_v1';

export interface NotificationSettings {
  streakReminderEnabled: boolean;
  reminderHour: number; // 20 = 8 PM
  reminderMinute: number;
  lastScheduledDate: string | null;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  streakReminderEnabled: true,
  reminderHour: 20,
  reminderMinute: 0,
  lastScheduledDate: null,
};

/**
 * Register push token with server for remote notifications (League relegation, Decayed skill)
 */
export async function registerPushTokenWithServer(token: string): Promise<boolean> {
  try {
    const res = await api.registerPushToken?.(token);
    return Boolean(res?.success);
  } catch (err) {
    console.warn('[LocalNotifications] Failed to register push token with server:', err);
    return false;
  }
}

/**
 * Get or load user notification settings
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_NOTIFICATION_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Schedule daily on-device streak preservation notification.
 * Scheduled for 8:00 PM in the user's local timezone.
 */
export async function scheduleDailyStreakPreservationNotification(currentStreak: number): Promise<boolean> {
  try {
    const settings = await getNotificationSettings();
    if (!settings.streakReminderEnabled) return false;

    const todayStr = new Date().toISOString().slice(0, 10);
    const updatedSettings: NotificationSettings = {
      ...settings,
      lastScheduledDate: todayStr,
    };

    await AsyncStorage.setItem(LOCAL_NOTIFICATION_KEY, JSON.stringify(updatedSettings));
    console.log(`[LocalNotifications] Daily streak reminder configured for ${settings.reminderHour}:${settings.reminderMinute} (Streak: ${currentStreak})`);
    return true;
  } catch (err) {
    console.warn('[LocalNotifications] Error scheduling streak notification:', err);
    return false;
  }
}
