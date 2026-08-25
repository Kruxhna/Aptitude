import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import haptics from './haptics';
import audio, { SoundEffect } from './audio';
import { api, UserPreferences } from '../api';

export type FeedbackType = 'correct' | 'wrong' | 'tap' | 'button' | 'streak' | 'complete' | 'modal';

interface FeedbackContextType {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  setHapticsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  triggerFeedback: (type: FeedbackType) => void;
}

const FeedbackContext = createContext<FeedbackContextType>({
  hapticsEnabled: true,
  soundEnabled: true,
  soundVolume: 70,
  setHapticsEnabled: () => {},
  setSoundEnabled: () => {},
  setSoundVolume: () => {},
  triggerFeedback: () => {},
});

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hapticsEnabled, setHapticsState] = useState<boolean>(true);
  const [soundEnabled, setSoundState] = useState<boolean>(true);
  const [soundVolume, setSoundVolumeState] = useState<number>(70);

  // Sync with API preferences on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await api.getPreferences();
        if (res?.preferences && isMounted) {
          const { hapticsEnabled: h, soundEnabled: s, soundVolume: v } = res.preferences;
          setHapticsState(h ?? true);
          setSoundState(s ?? true);
          setSoundVolumeState(v ?? 70);

          haptics.setEnabled(h ?? true);
          audio.setEnabled(s ?? true);
          audio.setVolume(v ?? 70);
        }
      } catch {
        // Fallback to local defaults if API offline
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const setHapticsEnabled = (enabled: boolean) => {
    setHapticsState(enabled);
    haptics.setEnabled(enabled);
    api.updatePreferences({ hapticsEnabled: enabled }).catch(() => {});
  };

  const setSoundEnabled = (enabled: boolean) => {
    setSoundState(enabled);
    audio.setEnabled(enabled);
    api.updatePreferences({ soundEnabled: enabled }).catch(() => {});
  };

  const setSoundVolume = (volume: number) => {
    setSoundVolumeState(volume);
    audio.setVolume(volume);
    api.updatePreferences({ soundVolume: volume }).catch(() => {});
  };

  const triggerFeedback = (type: FeedbackType) => {
    try {
      switch (type) {
        case 'correct':
          haptics.correctAnswer().catch(() => {});
          audio.playSound('correct').catch(() => {});
          break;
        case 'wrong':
          haptics.wrongAnswer().catch(() => {});
          audio.playSound('wrong').catch(() => {});
          break;
        case 'tap':
        case 'button':
          haptics.buttonPress().catch(() => {});
          audio.playSound('click').catch(() => {});
          break;
        case 'streak':
          haptics.notificationSuccess().catch(() => {});
          audio.playSound('streak').catch(() => {});
          break;
        case 'complete':
          haptics.notificationSuccess().catch(() => {});
          audio.playSound('complete').catch(() => {});
          break;
        case 'modal':
          haptics.modalOpen().catch(() => {});
          break;
        default:
          haptics.impactLight().catch(() => {});
          break;
      }
    } catch {
      // Defensive fallback — never crash UI thread
    }
  };

  const value = useMemo(
    () => ({
      hapticsEnabled,
      soundEnabled,
      soundVolume,
      setHapticsEnabled,
      setSoundEnabled,
      setSoundVolume,
      triggerFeedback,
    }),
    [hapticsEnabled, soundEnabled, soundVolume]
  );

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
};

export const useFeedback = () => useContext(FeedbackContext);
export default FeedbackProvider;
