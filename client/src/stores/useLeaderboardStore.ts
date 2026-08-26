import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, LeaderboardResponse } from '../api';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  rank: number;
  xp: number;
  streak: number;
  league?: string;
  activeCostume?: string;
  isCurrentUser?: boolean;
}

export interface LeaderboardState {
  leaderboard: LeaderboardEntry[];
  userRank: number | null;
  currentLeague: string;
  lastFetchedAt: number | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchLeaderboard: (forceRefresh?: boolean) => Promise<void>;
  setLeaderboardData: (data: LeaderboardResponse) => void;
  resetLeaderboard: () => void;
}

const LEADERBOARD_TTL_MS = 2 * 60 * 1000; // 2 minutes

export const useLeaderboardStore = create<LeaderboardState>()(
  persist(
    (set, get) => ({
      leaderboard: [],
      userRank: null,
      currentLeague: 'Bronze',
      lastFetchedAt: null,
      isLoading: false,
      error: null,

      fetchLeaderboard: async (forceRefresh = false) => {
        const { lastFetchedAt, isLoading } = get();
        const now = Date.now();

        // If data is fresh and not forced, return cached state
        if (!forceRefresh && lastFetchedAt && now - lastFetchedAt < LEADERBOARD_TTL_MS) {
          return;
        }

        if (isLoading) return;

        try {
          set({ isLoading: true, error: null });
          const response = await api.getLeaderboard();
          if (response) {
            get().setLeaderboardData(response);
          }
        } catch (err: any) {
          console.warn('[useLeaderboardStore] fetchLeaderboard error (using cache):', err);
          set({
            isLoading: false,
            error: err?.message || 'Failed to refresh leaderboard',
          });
        }
      },

      setLeaderboardData: (data: LeaderboardResponse) => {
        const entries: LeaderboardEntry[] = (data.leaderboard || data.entries || []).map(
          (item: any, idx: number) => ({
            userId: item.userId || item.id || `user_${idx}`,
            displayName: item.displayName || item.name || 'Anonymous Aspirant',
            rank: item.rank ?? idx + 1,
            xp: item.xp ?? item.totalXp ?? item.weeklyXP ?? 0,
            streak: item.streak?.current ?? item.streak ?? 0,
            league: item.league || data.league || 'Bronze',
            activeCostume: item.mascot?.activeCostume || item.activeCostume || 'DEFAULT',
            isCurrentUser: item.isCurrentUser || item.isMe || false,
          })
        );

        const currentRank =
          data.userRank ??
          entries.find((e) => e.isCurrentUser)?.rank ??
          null;

        set({
          leaderboard: entries,
          userRank: currentRank,
          currentLeague: data.league || data.currentLeague || 'Bronze',
          lastFetchedAt: Date.now(),
          isLoading: false,
          error: null,
        });
      },

      resetLeaderboard: () => {
        set({
          leaderboard: [],
          userRank: null,
          currentLeague: 'Bronze',
          lastFetchedAt: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: '@gate_aptitude_leaderboard_store_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        leaderboard: state.leaderboard,
        userRank: state.userRank,
        currentLeague: state.currentLeague,
        lastFetchedAt: state.lastFetchedAt,
      }),
    }
  )
);
