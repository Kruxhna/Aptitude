import axios from 'axios';
import { Platform } from 'react-native';

// Use localhost for iOS simulator, 10.0.2.2 for Android emulator
const API_URL = __DEV__ 
  ? (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api')
  : 'https://production-api.example.com/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export interface UserMeResponse {
  userId?: string;
  currentStreak?: number;
  totalXp?: number;
  [key: string]: any;
}

export interface ProgressResponse {
  overallElo?: number;
  skills?: Record<string, { elo: number; score?: number }>;
  [key: string]: any;
}

export interface HistoryResponse {
  history?: any[];
  [key: string]: any;
}

export interface LeaderboardResponse {
  leaderboard?: any[];
  [key: string]: any;
}

export interface Question {
  id: string;
  _id: string;
  type: 'mcq' | 'numerical' | 'spatial';
  skill: 'verbal' | 'quantitative' | 'logical' | 'spatial';
  text: string;
  options?: string[];
  imageOptions?: string[];
  imagePath?: string;
  difficulty?: number;
  parTimeSeconds?: number;
  // Learn mode fields (present only when mode=learn)
  strategyTip?: string | null;
  tipDuration?: number;
  tipAnimation?: 'slideUp' | 'fadeIn' | 'springIn';
  hintLevels?: { level1?: string; level2?: string; level3?: string } | null;
  wrongAnswerExplanations?: Record<string, string> | null;
  conceptId?: string | null;
}

export type SprintMode = 'learn' | 'test';

export interface SprintSession {
  sprintId: string;
  type: string;
  mode: SprintMode;
  questionCount: number;
  questions: Question[];
}

export interface SprintSubmissionResponse {
  message: string;
  mode: SprintMode;
  accuracy: number;
  totalCorrect: number;
  totalQuestions: number;
  xpEarned: number;
  xpMultiplier: number;
  xpTotal: number;
  streak: { current: number; freezesAvailable: number; freezeUsed: boolean };
  eloBefore: Record<string, number>;
  eloAfter: Record<string, number>;
  eloDeltas: Record<string, number>;
  results: SprintResult[];
}

export interface SprintResult {
  questionId: string;
  correct: boolean;
  userAnswer: string | number;
  correctAnswer: string | number;
  explanation: string;
  timeMs: number;
  skill: string;
  strategyTip?: string | null;
  wrongAnswerExplanations?: Record<string, string>;
}

// ─── Onboarding Types ──────────────────────────────────────────

export interface OnboardingStatus {
  placementCompleted: boolean;
  goalsSet: boolean;
  onboardingCompleted: boolean;
}

export interface PlacementQuestion {
  id: string;
  skill: string;
  prompt: string;
  options: string[];
  difficulty: number;
}

export interface PlacementSubmitResponse {
  message: string;
  initialElo: Record<string, number>;
  skillBreakdown: Record<string, { correct: boolean; prompt: string }>;
  totalCorrect: number;
  totalQuestions: number;
}

export const api = {
  getUserMe: async (): Promise<UserMeResponse> => {
    try {
      const response = await apiClient.get('/users/me');
      return response.data;
    } catch {
      return { currentStreak: 5, totalXp: 2450 };
    }
  },
  getSprint: async (type: string, mode: SprintMode = 'test'): Promise<SprintSession> => {
    const response = await apiClient.get(`/sprint`, { params: { type, mode } });
    return response.data;
  },
  submitSprint: async (payload: { sprintId: string; responses: any[] }): Promise<SprintSubmissionResponse> => {
    const response = await apiClient.post(`/sprint/submit`, payload);
    return response.data;
  },
  getProgress: async () => {
    const response = await apiClient.get(`/analytics/progress`);
    return response.data;
  },
  getHistory: async () => {
    const response = await apiClient.get(`/analytics/history`);
    return response.data;
  },
  getLeaderboard: async () => {
    const response = await apiClient.get(`/leaderboard`);
    return response.data;
  },

  // ─── Onboarding ────────────────────────────────────────────
  getOnboardingStatus: async (): Promise<OnboardingStatus> => {
    try {
      const response = await apiClient.get('/onboarding/status');
      return response.data;
    } catch {
      return { placementCompleted: false, goalsSet: false, onboardingCompleted: false };
    }
  },
  startPlacement: async (): Promise<{ sessionId: string }> => {
    const response = await apiClient.post('/onboarding/placement/start');
    return response.data;
  },
  getPlacementQuestions: async (): Promise<{ questions: PlacementQuestion[]; totalCount: number }> => {
    const response = await apiClient.get('/onboarding/placement/questions');
    return response.data;
  },
  submitPlacement: async (payload: {
    sessionId: string;
    answers: { questionId: string; selectedIndex: number; timeMs?: number }[];
  }): Promise<PlacementSubmitResponse> => {
    const response = await apiClient.post('/onboarding/placement/submit', payload);
    return response.data;
  },
  saveGoal: async (dailyGoal: number): Promise<{ ok: boolean }> => {
    const response = await apiClient.post('/onboarding/goals', { dailyGoal });
    return response.data;
  },
  completeOnboarding: async (): Promise<{ ok: boolean }> => {
    const response = await apiClient.patch('/onboarding/tutorial/complete');
    return response.data;
  },
};
