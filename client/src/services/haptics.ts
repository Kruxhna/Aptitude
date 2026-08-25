/**
 * haptics.ts
 * Central haptic feedback service for GATE Aptitude Trainer.
 *
 * All haptic methods are safe to call unconditionally — they:
 *   1. No-op on web (expo-haptics is native-only)
 *   2. No-op when device has no haptic hardware or on emulators
 *   3. Respect the global enabled/disabled toggle
 *   4. Catch all native promise rejections safely
 *
 * Usage:
 *   import { HapticPatterns, hapticsService } from '../services/haptics';
 *   HapticPatterns.lightTap();         // quick one-liner
 *   hapticsService.setEnabled(false);  // disable globally
 */

import { Platform } from 'react-native';

// Dynamically import to avoid crashing on web
let Haptics: typeof import('expo-haptics') | null = null;
if (Platform.OS !== 'web') {
  try {
    Haptics = require('expo-haptics');
  } catch {
    // Device does not have expo-haptics — all patterns will no-op
  }
}

// ─── Internal singleton state ────────────────────────────────────────────────

class HapticsService {
  private _enabled = true;
  private _available = Platform.OS !== 'web' && Haptics !== null;

  /** Enable or disable all haptic feedback globally. */
  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  get isEnabled(): boolean {
    return this._enabled && this._available;
  }

  /** Safe wrapper — swallows any hardware errors silently. */
  private async _run(fn: () => Promise<void>): Promise<void> {
    if (!this.isEnabled) return;
    try {
      await fn();
    } catch {
      // Ignore — hardware not available, emulator, or permission denied
    }
  }

  // ── Impact patterns ──────────────────────────────────────────────────────

  /** Light tap — select an option, toggle, neutral action. */
  async lightTap(): Promise<void> {
    await this._run(() =>
      Haptics!.impactAsync(Haptics!.ImpactFeedbackStyle.Light)
    );
  }

  /** Medium tap — advance, submit, navigate. */
  async mediumTap(): Promise<void> {
    await this._run(() =>
      Haptics!.impactAsync(Haptics!.ImpactFeedbackStyle.Medium)
    );
  }

  /** Heavy — correct answer, level up, achievement unlocked. */
  async successHeavy(): Promise<void> {
    await this._run(() =>
      Haptics!.impactAsync(Haptics!.ImpactFeedbackStyle.Heavy)
    );
  }

  /**
   * Double-tap — wrong answer, streak break.
   * Two heavy impacts 150ms apart for a distinct "failure" feel.
   */
  async failureDoubleTap(): Promise<void> {
    if (!this.isEnabled) return;
    try {
      await Haptics!.impactAsync(Haptics!.ImpactFeedbackStyle.Heavy);
      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          try {
            await Haptics!.impactAsync(Haptics!.ImpactFeedbackStyle.Heavy);
          } catch { /* ignore */ }
          resolve();
        }, 150);
      });
    } catch { /* ignore */ }
  }

  // ── Notification patterns ────────────────────────────────────────────────

  /** Success notification — XP earned, daily goal reached. */
  async successNotification(): Promise<void> {
    await this._run(() =>
      Haptics!.notificationAsync(Haptics!.NotificationFeedbackType.Success)
    );
  }

  /** Warning notification — low time, streak freeze used. */
  async warningNotification(): Promise<void> {
    await this._run(() =>
      Haptics!.notificationAsync(Haptics!.NotificationFeedbackType.Warning)
    );
  }

  /** Error notification — invalid action. */
  async errorNotification(): Promise<void> {
    await this._run(() =>
      Haptics!.notificationAsync(Haptics!.NotificationFeedbackType.Error)
    );
  }

  // ── Selection ────────────────────────────────────────────────────────────

  /** Selection change — scroll through list items, picker rotation. */
  async selectionChange(): Promise<void> {
    await this._run(() => Haptics!.selectionAsync());
  }

  // ── Composite patterns ───────────────────────────────────────────────────

  /**
   * SPRINTY jump — medium then light impact 100ms apart.
   * Fired when the mascot jumps or celebrates.
   */
  async sprintJump(): Promise<void> {
    if (!this.isEnabled) return;
    try {
      await Haptics!.impactAsync(Haptics!.ImpactFeedbackStyle.Medium);
      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          try {
            await Haptics!.impactAsync(Haptics!.ImpactFeedbackStyle.Light);
          } catch { /* ignore */ }
          resolve();
        }, 100);
      });
    } catch { /* ignore */ }
  }

  /**
   * Correct answer combo — heavy impact, then 100ms later success notification.
   * Use instead of calling successHeavy + successNotification separately.
   */
  async correctAnswerCombo(): Promise<void> {
    if (!this.isEnabled) return;
    try {
      await this.successHeavy();
      setTimeout(() => {
        this.successNotification();
      }, 100);
    } catch { /* ignore */ }
  }
}

// ─── Exported singleton ──────────────────────────────────────────────────────

export const hapticsService = new HapticsService();

/**
 * Convenience shorthand object — identical to hapticsService methods
 * but callable without `await` when fire-and-forget is acceptable.
 */
export const HapticPatterns = {
  lightTap: () => hapticsService.lightTap(),
  mediumTap: () => hapticsService.mediumTap(),
  successHeavy: () => hapticsService.successHeavy(),
  failureDoubleTap: () => hapticsService.failureDoubleTap(),
  successNotification: () => hapticsService.successNotification(),
  warningNotification: () => hapticsService.warningNotification(),
  errorNotification: () => hapticsService.errorNotification(),
  selectionChange: () => hapticsService.selectionChange(),
  sprintJump: () => hapticsService.sprintJump(),
  correctAnswerCombo: () => hapticsService.correctAnswerCombo(),
} as const;

export default hapticsService;
