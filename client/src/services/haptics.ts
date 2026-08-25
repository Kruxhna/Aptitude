import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Defensive Haptics Service for React Native / Expo.
 * Wraps all expo-haptics calls in safe try-catch blocks to prevent unhandled
 * promise rejections on Android emulators, web, or devices without haptic hardware.
 */
class HapticsService {
  private isEnabled: boolean = true;

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public async impactLight(): Promise<boolean> {
    if (!this.isEnabled || Platform.OS === 'web') return false;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return true;
    } catch {
      // Gracefully ignore on emulators or unsupported hardware
      return false;
    }
  }

  public async impactMedium(): Promise<boolean> {
    if (!this.isEnabled || Platform.OS === 'web') return false;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return true;
    } catch {
      return false;
    }
  }

  public async impactHeavy(): Promise<boolean> {
    if (!this.isEnabled || Platform.OS === 'web') return false;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return true;
    } catch {
      return false;
    }
  }

  public async notificationSuccess(): Promise<boolean> {
    if (!this.isEnabled || Platform.OS === 'web') return false;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch {
      return false;
    }
  }

  public async notificationWarning(): Promise<boolean> {
    if (!this.isEnabled || Platform.OS === 'web') return false;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return true;
    } catch {
      return false;
    }
  }

  public async notificationError(): Promise<boolean> {
    if (!this.isEnabled || Platform.OS === 'web') return false;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return true;
    } catch {
      return false;
    }
  }

  public async selection(): Promise<boolean> {
    if (!this.isEnabled || Platform.OS === 'web') return false;
    try {
      await Haptics.selectionAsync();
      return true;
    } catch {
      return false;
    }
  }

  // ── Semantic helpers ──
  public async buttonPress(): Promise<boolean> {
    return this.impactLight();
  }

  public async correctAnswer(): Promise<boolean> {
    return this.notificationSuccess();
  }

  public async wrongAnswer(): Promise<boolean> {
    return this.notificationError();
  }

  public async modalOpen(): Promise<boolean> {
    return this.impactMedium();
  }
}

export const haptics = new HapticsService();
export default haptics;
