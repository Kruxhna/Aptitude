/**
 * audio.ts
 * Central audio playback service for GATE Aptitude Trainer.
 *
 * Architecture:
 *   - Singleton AudioService class
 *   - All sounds pre-loaded at app startup via loadSounds()
 *   - Each named method plays with its optimal volume
 *   - Gracefully skips missing/empty audio files (logs warning, no crash)
 *   - Volume is scaled: userVolume (0–100) × perSoundVolume (0.0–1.0)
 *   - Safe try-catch wrappers around all native operations
 *
 * Usage:
 *   import { audioService } from '../services/audio';
 *   await audioService.loadSounds();    // once, in root layout
 *   audioService.correct();             // fire-and-forget
 *   audioService.setVolume(80);         // adjust master volume
 *   audioService.setEnabled(false);     // mute all
 *   audioService.unloadAll();           // cleanup on unmount
 */

import { Platform } from 'react-native';

// Lazily import expo-av to avoid crashing on web if not available
let Audio: typeof import('expo-av').Audio | null = null;

if (Platform.OS !== 'web') {
  try {
    const av = require('expo-av');
    Audio = av.Audio;
  } catch {
    // expo-av not available — all sounds will silently no-op
  }
}

// ─── Sound file registry ─────────────────────────────────────────────────────
// Keys map to files in /client/assets/audio/<key>.mp3

const SOUND_REGISTRY: Record<string, any> = {
  'pop-correct':      require('../../assets/audio/pop-correct.mp3'),
  'descending-wrong': require('../../assets/audio/descending-wrong.mp3'),
  'streak-chime':     require('../../assets/audio/streak-chime.mp3'),
  'level-up':         require('../../assets/audio/level-up.mp3'),
  'sprint-start':     require('../../assets/audio/sprint-start.mp3'),
  'sprint-end':       require('../../assets/audio/sprint-end.mp3'),
  'timer-tick':       require('../../assets/audio/timer-tick.mp3'),
  'button-tap':       require('../../assets/audio/button-tap.mp3'),
  'xp-earn':          require('../../assets/audio/xp-earn.mp3'),
  'mascot-jump':      require('../../assets/audio/mascot-jump.mp3'),
};

// ─── AudioService ─────────────────────────────────────────────────────────────

class AudioService {
  private sounds: Map<string, any> = new Map();
  private _enabled = true;
  private _masterVolume = 70; // 0–100

  /** Master enable/disable toggle. When false, all play() calls are no-ops. */
  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  /** Set master volume (0–100). Applied multiplicatively with per-sound volume. */
  setVolume(volume: number): void {
    this._masterVolume = Math.max(0, Math.min(100, volume));
  }

  get masterVolumeFraction(): number {
    return this._masterVolume / 100;
  }

  /**
   * Preload all sounds from SOUND_REGISTRY.
   * Call once after the splash screen hides, before the first quiz question.
   * Missing or corrupt files are skipped with a console warning.
   */
  async loadSounds(): Promise<void> {
    if (!Audio) return; // Web / no expo-av

    try {
      // Configure audio session for low-latency playback mixed with system audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (err) {
      console.warn('[AudioService] setAudioModeAsync failed:', err);
    }

    const entries = Object.entries(SOUND_REGISTRY);
    await Promise.all(
      entries.map(async ([name, source]) => {
        try {
          const { sound } = await Audio.Sound.createAsync(source, {
            shouldPlay: false,
            volume: 1.0,
          });
          this.sounds.set(name, sound);
        } catch (err) {
          // Gracefully skip — placeholder stub or corrupt file
          console.warn(`[AudioService] Could not load sound "${name}":`, err);
        }
      })
    );
  }

  /** Play a registered sound by name with an optional per-sound volume (0.0–1.0). */
  async playSound(name: string, perSoundVolume = 0.5): Promise<void> {
    if (!this._enabled) return;
    const sound = this.sounds.get(name);
    if (!sound) return; // Not loaded or skipped during load

    try {
      const finalVolume = perSoundVolume * this.masterVolumeFraction;
      await sound.setVolumeAsync(finalVolume);
      await sound.replayAsync();
    } catch (err) {
      console.warn(`[AudioService] Failed to play "${name}":`, err);
    }
  }

  // ── Named playback methods ────────────────────────────────────────────────
  // Volumes are tuned for balance: correct/wrong louder, UI taps quieter.

  /** Subtle pop — correct answer. */
  correct(): void { this.playSound('pop-correct', 0.6).catch(() => {}); }

  /** Descending tone — wrong answer. */
  wrong(): void { this.playSound('descending-wrong', 0.7).catch(() => {}); }

  /** Satisfying chime — streak continued or milestone. */
  streakChime(): void { this.playSound('streak-chime', 0.8).catch(() => {}); }

  /** Celebratory fanfare — level up or achievement. */
  levelUp(): void { this.playSound('level-up', 0.9).catch(() => {}); }

  /** Quick whoosh — sprint begins. */
  sprintStart(): void { this.playSound('sprint-start', 0.5).catch(() => {}); }

  /** Gentle completion sound — sprint results shown. */
  sprintEnd(): void { this.playSound('sprint-end', 0.5).catch(() => {}); }

  /** Light tap — UI button interaction. */
  buttonTap(): void { this.playSound('button-tap', 0.3).catch(() => {}); }

  /** Coin-like sound — XP counter increments. */
  xpEarn(): void { this.playSound('xp-earn', 0.6).catch(() => {}); }

  /** Playful bounce — SPRINTY mascot jumps. */
  mascotJump(): void { this.playSound('mascot-jump', 0.5).catch(() => {}); }

  /** Subtle tick — final 5 seconds countdown. */
  timerTick(): void { this.playSound('timer-tick', 0.2).catch(() => {}); }

  /**
   * Release all sound objects from native memory.
   * Call in root layout cleanup (useEffect return) or on logout.
   */
  async unloadAll(): Promise<void> {
    const unloads = Array.from(this.sounds.values()).map(async (sound) => {
      try { await sound.unloadAsync(); } catch { /* ignore */ }
    });
    await Promise.all(unloads);
    this.sounds.clear();
  }
}

// ─── Exported singleton ──────────────────────────────────────────────────────

export const audioService = new AudioService();
export default audioService;
