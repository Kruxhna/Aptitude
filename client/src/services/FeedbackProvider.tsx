/**
 * FeedbackProvider.tsx
 * React Context that surfaces haptics, audio, and accessibility announcements
 * to the entire component tree via useFeedback().
 *
 * Responsibilities:
 *   - Load user preferences from AsyncStorage on mount
 *   - Apply preferences to hapticsService and audioService singletons
 *   - Expose a stable `feedback` object with haptics/audio/announce helpers
 *   - Re-apply preferences whenever they change via `updatePreferences()`
 *
 * Usage:
 *   // In _layout.tsx (root):
 *   <FeedbackProvider>
 *     <Stack ... />
 *   </FeedbackProvider>
 *
 *   // In any component:
 *   const { feedback } = useFeedback();
 *   feedback.haptics.lightTap();
 *   feedback.audio.correct();
 *   feedback.announce('Correct! Well done.');
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hapticsService, HapticPatterns } from './haptics';
import { audioService } from './audio';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserPreferences {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  soundVolume: number; // 0–100
}

const DEFAULT_PREFERENCES: UserPreferences = {
  hapticsEnabled: true,
  soundEnabled: true,
  soundVolume: 70,
};

const STORAGE_KEY = '@gate_aptitude_prefs_v1';

export interface FeedbackContextValue {
  preferences: UserPreferences;
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>;
  /** Wrappers that respect enabled/volume state — use these in components. */
  feedback: {
    haptics: typeof HapticPatterns;
    audio: typeof audioService;
    /** Announce a message to screen readers (VoiceOver / TalkBack). */
    announce: (message: string) => void;
  };
  prefsLoaded: boolean;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const soundsLoaded = useRef(false);

  // Load preferences from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored: Partial<UserPreferences> = JSON.parse(raw);
          const merged = { ...DEFAULT_PREFERENCES, ...stored };
          setPreferences(merged);
          applyToServices(merged);
        }
      } catch (err) {
        console.warn('[FeedbackProvider] Could not load preferences:', err);
      } finally {
        setPrefsLoaded(true);
      }
    })();
  }, []);

  // Load audio assets once preferences are resolved and sound is enabled
  useEffect(() => {
    if (!prefsLoaded) return;
    if (preferences.soundEnabled && !soundsLoaded.current) {
      soundsLoaded.current = true;
      audioService.loadSounds().catch((err) =>
        console.warn('[FeedbackProvider] Sound preload failed:', err)
      );
    }
  }, [prefsLoaded, preferences.soundEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioService.unloadAll();
    };
  }, []);

  const updatePreferences = useCallback(async (patch: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...patch };
      applyToServices(next);
      // Persist to AsyncStorage (fire-and-forget)
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err) =>
        console.warn('[FeedbackProvider] Prefs save failed:', err)
      );
      return next;
    });
  }, []);

  const announce = useCallback((message: string) => {
    // Always announce regardless of sound preference — screen reader is separate
    try {
      AccessibilityInfo.announceForAccessibility(message);
    } catch { /* ignore */ }
  }, []);

  const contextValue = useMemo<FeedbackContextValue>(
    () => ({
      preferences,
      updatePreferences,
      feedback: {
        haptics: HapticPatterns,
        audio: audioService,
        announce,
      },
      prefsLoaded,
    }),
    [preferences, updatePreferences, announce, prefsLoaded]
  );

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
    </FeedbackContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error('useFeedback() must be used inside <FeedbackProvider>');
  }
  return ctx;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function applyToServices(prefs: UserPreferences): void {
  hapticsService.setEnabled(prefs.hapticsEnabled);
  audioService.setEnabled(prefs.soundEnabled);
  audioService.setVolume(prefs.soundVolume);
}
