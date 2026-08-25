import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Dynamically resolves the API Base URL:
 * 1. Explicit env var: process.env.EXPO_PUBLIC_API_URL
 * 2. Physical Android/iOS device (Expo Go / Dev Build): extract host LAN IP from Constants.expoConfig?.hostUri or debuggerHost
 * 3. Android Emulator fallback: http://10.0.2.2:3000/api
 * 4. iOS Simulator / Web / Default: http://localhost:3000/api
 */
export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  if (__DEV__) {
    // Attempt LAN IP resolution from Expo hostUri (e.g. "192.168.1.50:8081")
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
      (Constants as any).manifest?.debuggerHost;

    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:3000/api`;
      }
    }

    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000/api';
    }
    return 'http://localhost:3000/api';
  }

  return 'https://production-api.example.com/api';
}

export const API_URL = getApiBaseUrl();

// Base host without /api suffix (used for serving static images, e.g. http://192.168.1.50:3000)
export const BASE_HOST_URL = API_URL.replace(/\/api\/?$/, '');

/**
 * Resolves relative asset paths (e.g. '/spatial/q1.png') to absolute URLs for Android/iOS Image components.
 */
export function resolveAssetUrl(path?: string | null): string | null {
  if (!path) return null;
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('file://') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_HOST_URL}${cleanPath}`;
}

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

export interface UserPreferences {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  soundVolume: number; // 0–100
}

export interface Question {
  id: string;
  _id: string;
  type: 'mcq' | 'numerical' | 'spatial';
  skill: 'verbal' | 'quantitative' | 'logical' | 'spatial';
  text: string;
  prompt?: string;
  explanation?: string;
  correctAnswer?: string | number;
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
  id?: string;
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
  streak: { current: number; freezesAvailable: number; freezeUsed: boolean; [key: string]: any };
  eloBefore: Record<string, number>;
  eloAfter: Record<string, number>;
  eloDeltas: Record<string, number>;
  ratingDeltas?: Record<string, number>;
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

  // ─── User Preferences ──────────────────────────────────────
  getPreferences: async (): Promise<{ preferences: UserPreferences }> => {
    try {
      const response = await apiClient.get('/users/preferences');
      return response.data;
    } catch {
      return {
        preferences: { hapticsEnabled: true, soundEnabled: true, soundVolume: 70 },
      };
    }
  },
  updatePreferences: async (
    patch: Partial<UserPreferences>
  ): Promise<{ preferences: UserPreferences }> => {
    const response = await apiClient.put('/users/preferences', patch);
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

  // ─── Learning Path / DAG ────────────────────────────────────
  getPathTree: async (): Promise<PathTreeResponse> => {
    const response = await apiClient.get('/path/tree');
    return response.data;
  },
  completePathNode: async (nodeId: string, accuracy: number = 1.0): Promise<{ ok: boolean; nodes: PathNode[] }> => {
    const response = await apiClient.post('/path/complete', { nodeId, accuracy });
    return response.data;
  },
};

// ─── Path & DAG Types ──────────────────────────────────────────

export type NodeState = 'LOCKED' | 'CURRENT' | 'COMPLETED' | 'PERFECT' | 'REVIEW';
export type SkillCategory = 'QUANTITATIVE' | 'LOGICAL' | 'VERBAL' | 'SPATIAL';

export interface PathNode {
  id: string;
  skill: SkillCategory;
  topic: string;
  description?: string;
  questionCount: number;
  estimatedMinutes: number;
  state: NodeState;
  eloRequirement?: number;
  xpReward?: number;
  isBranch: boolean;        // true if side path, false if trunk
  branchParentId?: string;  // parent node on main trunk
  mergeTargetId?: string;
  position: { x: number; y: number }; // Coordinates for layout & SVG connectors
  accuracy?: number | null;
  completedAt?: string | null;
}

export interface PathTreeResponse {
  nodes: PathNode[];
  stats: {
    totalNodes: number;
    completedCount: number;
    progressPercent: number;
    currentNodeId: string;
    currentTopic: string;
  };
}

