import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, UserMeResponse } from '../api';

export type CostumeId = 'DEFAULT' | 'SPACE_HELMET' | 'WIZARD_HAT' | 'GOLDEN_CROWN' | string;

export interface UserElo {
  [key: string]: number;
  verbal: number;
  quantitative: number;
  logical: number;
  spatial: number;
}

export interface UserState {
  userId: string | null;
  displayName: string;
  elo: UserElo;
  currentStreak: number;
  highestStreak: number;
  freezesAvailable: number;
  totalXp: number;
  gems: number;
  inventory: Array<{ itemId: string; quantity: number }>;
  activeBoosts: Array<{ boostType: string; expiresAt: string; multiplier: number }>;
  achievements: Array<{ id: string; title: string; icon: string; gemReward: number; unlockedAt: string }>;
  activeCostume: CostumeId;
  unlockedCostumes: CostumeId[];
  currentLeague: string;
  lastActiveAt: string | null;
  isPendingSync: boolean;
  isLoading: boolean;

  // Actions
  setUserFromResponse: (user: Partial<UserMeResponse>) => void;
  updateElo: (elo: Partial<UserElo>) => void;
  optimisticAddXp: (amount: number) => void;
  optimisticAddGems: (amount: number) => void;
  optimisticIncrementStreak: () => void;
  optimisticResetStreak: () => void;
  setActiveCostume: (costumeId: CostumeId) => void;
  setUnlockedCostumes: (costumes: CostumeId[]) => void;
  setPendingSync: (isPending: boolean) => void;
  fetchUserProfile: () => Promise<void>;
  resetUser: () => void;
}

const DEFAULT_USER_STATE = {
  userId: null,
  displayName: 'GATE Aspirant',
  elo: {
    verbal: 1000,
    quantitative: 1000,
    logical: 1000,
    spatial: 1000,
  },
  currentStreak: 0,
  highestStreak: 0,
  freezesAvailable: 1,
  totalXp: 0,
  gems: 100,
  inventory: [],
  activeBoosts: [],
  achievements: [],
  activeCostume: 'DEFAULT' as CostumeId,
  unlockedCostumes: ['DEFAULT'] as CostumeId[],
  currentLeague: 'Bronze',
  lastActiveAt: null,
  isPendingSync: false,
  isLoading: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_USER_STATE,

      setUserFromResponse: (user: Partial<UserMeResponse>) => {
        set({
          userId: user.id || user.userId || get().userId,
          displayName: user.displayName || get().displayName,
          elo: {
            verbal: user.elo?.verbal ?? get().elo.verbal,
            quantitative: user.elo?.quantitative ?? get().elo.quantitative,
            logical: user.elo?.logical ?? get().elo.logical,
            spatial: user.elo?.spatial ?? get().elo.spatial,
            ...(user.elo || {}),
          },
          currentStreak: user.streak?.current ?? user.currentStreak ?? get().currentStreak,
          freezesAvailable: user.streak?.freezesAvailable ?? get().freezesAvailable,
          totalXp: user.xpTotal ?? user.totalXp ?? get().totalXp,
          gems: user.gems ?? get().gems,
          inventory: user.inventory ?? get().inventory,
          activeBoosts: user.activeBoosts ?? get().activeBoosts,
          achievements: user.achievements ?? get().achievements,
          currentLeague: user.currentLeague || get().currentLeague,
          activeCostume: (user.mascot?.activeCostume as CostumeId) || get().activeCostume,
          unlockedCostumes:
            (user.mascot?.unlockedCostumes as CostumeId[]) || get().unlockedCostumes,
          lastActiveAt: user.lastActiveAt || get().lastActiveAt,
          isLoading: false,
        });
      },

      updateElo: (newElo: Partial<UserElo>) => {
        set((state) => ({
          elo: {
            ...state.elo,
            ...(Object.fromEntries(
              Object.entries(newElo).filter(([_, v]) => v !== undefined)
            ) as Record<string, number>),
            verbal: newElo.verbal ?? state.elo.verbal,
            quantitative: newElo.quantitative ?? state.elo.quantitative,
            logical: newElo.logical ?? state.elo.logical,
            spatial: newElo.spatial ?? state.elo.spatial,
          },
        }));
      },

      optimisticAddXp: (amount: number) => {
        set((state) => ({
          totalXp: state.totalXp + amount,
          isPendingSync: true,
        }));
      },

      optimisticAddGems: (amount: number) => {
        set((state) => ({
          gems: Math.max(0, state.gems + amount),
          isPendingSync: true,
        }));
      },

      optimisticIncrementStreak: () => {
        set((state) => {
          const nextStreak = state.currentStreak + 1;
          return {
            currentStreak: nextStreak,
            highestStreak: Math.max(state.highestStreak, nextStreak),
            isPendingSync: true,
          };
        });
      },

      optimisticResetStreak: () => {
        set({
          currentStreak: 0,
          isPendingSync: true,
        });
      },

      setActiveCostume: (costumeId: CostumeId) => {
        set({ activeCostume: costumeId });
      },

      setUnlockedCostumes: (costumes: CostumeId[]) => {
        set({ unlockedCostumes: costumes });
      },

      setPendingSync: (isPending: boolean) => {
        set({ isPendingSync: isPending });
      },

      fetchUserProfile: async () => {
        try {
          set({ isLoading: true });
          const user = await api.getUserMe();
          get().setUserFromResponse(user);
        } catch (err) {
          console.warn('[useUserStore] Failed to fetch user profile, using cached:', err);
          set({ isLoading: false });
        }
      },

      resetUser: () => {
        set(DEFAULT_USER_STATE);
      },
    }),
    {
      name: '@gate_aptitude_user_store_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userId: state.userId,
        displayName: state.displayName,
        elo: state.elo,
        currentStreak: state.currentStreak,
        highestStreak: state.highestStreak,
        freezesAvailable: state.freezesAvailable,
        totalXp: state.totalXp,
        gems: state.gems,
        inventory: state.inventory,
        activeBoosts: state.activeBoosts,
        achievements: state.achievements,
        activeCostume: state.activeCostume,
        unlockedCostumes: state.unlockedCostumes,
        currentLeague: state.currentLeague,
        lastActiveAt: state.lastActiveAt,
      }),
    }
  )
);
