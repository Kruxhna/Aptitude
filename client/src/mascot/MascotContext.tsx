import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MascotEmotion, CostumeId, MascotState } from './types';
import { api } from '../api';

const MASCOT_STORAGE_KEY = '@gate_aptitude_mascot_prefs_v1';
const INACTIVITY_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 Hours in milliseconds

export interface MascotContextValue {
  emotion: MascotEmotion;
  activeCostume: CostumeId;
  unlockedCostumes: CostumeId[];
  isSleeping: boolean;
  setEmotion: (emotion: MascotEmotion, durationMs?: number) => void;
  equipCostume: (costumeId: CostumeId) => Promise<boolean>;
  purchaseCostume: (costumeId: CostumeId) => Promise<{ success: boolean; message?: string }>;
  wakeUpMascot: () => void;
  refreshMascotState: () => Promise<void>;
}

const MascotContext = createContext<MascotContextValue | null>(null);

export function MascotProvider({ children }: { children: ReactNode }) {
  const [emotion, setEmotionState] = useState<MascotEmotion>('IDLE_HOVER');
  const [activeCostume, setActiveCostume] = useState<CostumeId>('DEFAULT');
  const [unlockedCostumes, setUnlockedCostumes] = useState<CostumeId[]>(['DEFAULT']);
  const [isSleeping, setIsSleeping] = useState<boolean>(false);

  const revertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load Cached Mascot State ────────────────────────────────
  useEffect(() => {
    const loadCachedState = async () => {
      try {
        const cached = await AsyncStorage.getItem(MASCOT_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.activeCostume) setActiveCostume(parsed.activeCostume);
          if (Array.isArray(parsed.unlockedCostumes)) setUnlockedCostumes(parsed.unlockedCostumes);
        }
      } catch (e) {
        console.warn('Failed to load cached mascot state:', e);
      }
    };

    loadCachedState();
  }, []);

  // ── Sync with API & Inactivity Evaluation ───────────────────
  const refreshMascotState = useCallback(async () => {
    try {
      const user = await api.getUserMe();
      if (user) {
        // Sync costume data
        if (user.mascot) {
          const active = (user.mascot.activeCostume as CostumeId) || 'DEFAULT';
          const unlocked = (user.mascot.unlockedCostumes as CostumeId[]) || ['DEFAULT'];
          setActiveCostume(active);
          setUnlockedCostumes(unlocked);

          await AsyncStorage.setItem(
            MASCOT_STORAGE_KEY,
            JSON.stringify({ activeCostume: active, unlockedCostumes: unlocked })
          );
        }

        // Check 48h+ Inactivity Trigger for SLEEPING_ZZZ
        if (user.lastActiveAt) {
          const lastActiveTime = new Date(user.lastActiveAt).getTime();
          const now = Date.now();
          if (now - lastActiveTime >= INACTIVITY_THRESHOLD_MS) {
            setIsSleeping(true);
            setEmotionState('SLEEPING_ZZZ');
          } else {
            setIsSleeping(false);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to refresh mascot state from API:', err);
    }
  }, []);

  useEffect(() => {
    refreshMascotState();
  }, [refreshMascotState]);

  // ── Set Mascot Emotion with Optional Auto-Revert ────────────
  const setEmotion = useCallback(
    (newEmotion: MascotEmotion, durationMs?: number) => {
      if (revertTimerRef.current) {
        clearTimeout(revertTimerRef.current);
        revertTimerRef.current = null;
      }

      setEmotionState(newEmotion);

      if (durationMs && durationMs > 0) {
        revertTimerRef.current = setTimeout(() => {
          setEmotionState(isSleeping ? 'SLEEPING_ZZZ' : 'IDLE_HOVER');
          revertTimerRef.current = null;
        }, durationMs);
      }
    },
    [isSleeping]
  );

  const wakeUpMascot = useCallback(() => {
    setIsSleeping(false);
    setEmotion('EXCITED_JUMP', 1500);
  }, [setEmotion]);

  // ── Equip Costume ───────────────────────────────────────────
  const equipCostume = useCallback(
    async (costumeId: CostumeId): Promise<boolean> => {
      try {
        setActiveCostume(costumeId);
        await AsyncStorage.setItem(
          MASCOT_STORAGE_KEY,
          JSON.stringify({ activeCostume: costumeId, unlockedCostumes })
        );

        // Sync with API in background
        await api.equipCostume(costumeId);
        return true;
      } catch (err) {
        console.warn('Failed to equip costume on server:', err);
        return false;
      }
    },
    [unlockedCostumes]
  );

  // ── Purchase Costume ────────────────────────────────────────
  const purchaseCostume = useCallback(
    async (costumeId: CostumeId): Promise<{ success: boolean; message?: string }> => {
      try {
        const res = await api.purchaseCostume(costumeId);
        if (res.success) {
          const nextUnlocked = (res.unlockedCostumes as CostumeId[]) || [
            ...unlockedCostumes,
            costumeId,
          ];
          setUnlockedCostumes(nextUnlocked);
          setActiveCostume(costumeId);

          await AsyncStorage.setItem(
            MASCOT_STORAGE_KEY,
            JSON.stringify({ activeCostume: costumeId, unlockedCostumes: nextUnlocked })
          );
          return { success: true, message: res.message };
        }
        return { success: false, message: 'Could not complete purchase' };
      } catch (err: any) {
        const errorMsg = err?.response?.data?.error || err.message || 'Purchase failed';
        return { success: false, message: errorMsg };
      }
    },
    [unlockedCostumes]
  );

  return (
    <MascotContext.Provider
      value={{
        emotion,
        activeCostume,
        unlockedCostumes,
        isSleeping,
        setEmotion,
        equipCostume,
        purchaseCostume,
        wakeUpMascot,
        refreshMascotState,
      }}
    >
      {children}
    </MascotContext.Provider>
  );
}

export function useMascot(): MascotContextValue {
  const context = useContext(MascotContext);
  if (!context) {
    throw new Error('useMascot must be used within a MascotProvider');
  }
  return context;
}
