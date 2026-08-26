import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Dynamically resolves the API Base URL:
 * 1. Explicit env var: process.env.EXPO_PUBLIC_API_URL
 * 2. Physical Android/iOS device (Expo Go / Dev Build): extract host LAN IP from Constants.expoConfig?.hostUri
 * 3. Android Emulator fallback: http://10.0.2.2:3000/api
 * 4. iOS Simulator / Web / Default: http://localhost:3000/api
 */
export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const lanIp = hostUri.split(':')[0];
    if (lanIp && lanIp !== 'localhost' && lanIp !== '127.0.0.1') {
      return `http://${lanIp}:3000/api`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }

  return 'http://localhost:3000/api';
}

const API_URL = getApiBaseUrl();
export const BASE_HOST_URL = API_URL.replace(/\/api\/?$/, '');

export function resolveAssetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
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
  timeout: 8000,
});

// ─── Interfaces & Types ──────────────────────────────────────────────────────

export interface UserMeResponse {
  userId?: string;
  id?: string;
  displayName?: string;
  currentStreak?: number;
  totalXp?: number;
  xpTotal?: number;
  elo?: Record<string, number>;
  streak?: {
    current: number;
    freezesAvailable: number;
    lastCompletedUTCDate?: string | null;
  };
  mascot?: {
    activeCostume: string;
    unlockedCostumes: string[];
  };
  lastActiveAt?: string | null;
  currentLeague?: string;
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
  userRank?: number | null;
  currentLeague?: string;
  league?: string;
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
  // Learn mode fields
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
  streak: { current: number; freezesAvailable: number; freezeUsed?: boolean; [key: string]: any };
  eloBefore: Record<string, number>;
  eloAfter: Record<string, number>;
  eloDeltas?: Record<string, number>;
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
  isBranch: boolean;
  branchParentId?: string;
  mergeTargetId?: string;
  position: { x: number; y: number };
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

// ─── Mascot & Costume Types ────────────────────────────────────

export interface CostumeItem {
  id: string;
  name: string;
  description: string;
  priceXP: number;
  icon: string;
  category: 'HEAD' | 'FACE' | 'BACK';
  isUnlocked: boolean;
  isEquipped: boolean;
}

export interface CostumeCatalogResponse {
  costumes: CostumeItem[];
  activeCostume: string;
  unlockedCostumes: string[];
  xpBalance: number;
}

export interface PurchaseCostumeResponse {
  success: boolean;
  message: string;
  unlockedCostumes: string[];
  activeCostume: string;
  xpBalance: number;
}

export interface EquipCostumeResponse {
  success: boolean;
  activeCostume: string;
  unlockedCostumes: string[];
}

// ─── Offline Fallback Sprint Generator ─────────────────────────

function createOfflineSprintFallback(type: string, mode: SprintMode = 'test'): SprintSession {
  return {
    id: `offline_sprint_${Date.now()}`,
    sprintId: `offline_sprint_${Date.now()}`,
    type,
    mode,
    questionCount: 5,
    questions: [
      {
        id: 'off_q1',
        _id: 'off_q1',
        type: 'mcq',
        skill: 'quantitative',
        text: 'If a car travels 240 km in 3 hours, what is its average speed in m/s?',
        options: ['20 m/s', '22.2 m/s', '25 m/s', '80 m/s'],
        correctAnswer: '22.2 m/s',
        explanation: 'Speed = 240 km / 3 h = 80 km/h. Convert to m/s: 80 * (5/18) = 22.22 m/s.',
        strategyTip: 'To convert km/h to m/s quickly, multiply by 5/18.',
      },
      {
        id: 'off_q2',
        _id: 'off_q2',
        type: 'mcq',
        skill: 'verbal',
        text: 'Choose the word that is most nearly OPPOSITE in meaning to EPHEMERAL:',
        options: ['Transient', 'Permanent', 'Fleeting', 'Momentary'],
        correctAnswer: 'Permanent',
        explanation: 'Ephemeral means lasting for a very short time. The opposite is Permanent.',
        strategyTip: 'Look for root clues: "epi" (upon) + "hemera" (day) = lasting only a day.',
      },
      {
        id: 'off_q3',
        _id: 'off_q3',
        type: 'mcq',
        skill: 'logical',
        text: 'Find the missing number in the sequence: 2, 6, 12, 20, 30, ?',
        options: ['40', '42', '44', '48'],
        correctAnswer: '42',
        explanation: 'Differences are +4, +6, +8, +10, +12. So 30 + 12 = 42 (or n*(n+1)).',
        strategyTip: 'Check consecutive first and second differences in series puzzles.',
      },
      {
        id: 'off_q4',
        _id: 'off_q4',
        type: 'mcq',
        skill: 'spatial',
        text: 'A standard cube has 6 faces numbered 1 to 6. Opposite faces sum to 7. If face 3 is on top, what is on the bottom?',
        options: ['2', '4', '5', '6'],
        correctAnswer: '4',
        explanation: 'Opposite faces sum to 7. Therefore, 7 - 3 = 4.',
        strategyTip: 'On standard dice, opposite face pairs are (1,6), (2,5), (3,4).',
      },
      {
        id: 'off_q5',
        _id: 'off_q5',
        type: 'mcq',
        skill: 'quantitative',
        text: 'The price of an item is increased by 20% and then decreased by 20%. What is the net change?',
        options: ['No change', '4% increase', '4% decrease', '2% decrease'],
        correctAnswer: '4% decrease',
        explanation: 'Net change = x + y + (xy/100) = 20 - 20 - (400/100) = -4%.',
        strategyTip: 'Equal percentage increase and decrease x% always results in an x^2/100 percent decrease.',
      },
    ],
  };
}

// ─── API Client Object ───────────────────────────────────────────────────────

export const api = {
  getUserMe: async (): Promise<UserMeResponse> => {
    try {
      const response = await apiClient.get('/users/me');
      return response.data;
    } catch {
      return {
        id: 'offline_user_01',
        displayName: 'GATE Aspirant',
        currentStreak: 5,
        totalXp: 2450,
        currentLeague: 'Bronze',
        elo: { verbal: 1050, quantitative: 1100, logical: 1080, spatial: 1040 },
        mascot: { activeCostume: 'DEFAULT', unlockedCostumes: ['DEFAULT'] },
      };
    }
  },

  getSprint: async (type: string, mode: SprintMode = 'test'): Promise<SprintSession> => {
    try {
      const response = await apiClient.get('/sprint', { params: { type, mode } });
      return response.data;
    } catch (err) {
      console.warn('[api.getSprint] Failed to fetch remote sprint. Serving offline fallback quiz:', err);
      return createOfflineSprintFallback(type, mode);
    }
  },

  submitSprint: async (payload: {
    sprintId: string;
    responses: any[];
  }): Promise<SprintSubmissionResponse> => {
    const response = await apiClient.post('/sprint/submit', payload);
    return response.data;
  },

  getProgress: async () => {
    const response = await apiClient.get('/analytics/progress');
    return response.data;
  },

  getHistory: async () => {
    const response = await apiClient.get('/analytics/history');
    return response.data;
  },

  getLeaderboard: async (): Promise<LeaderboardResponse> => {
    const response = await apiClient.get('/leaderboard');
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
      return { placementCompleted: true, goalsSet: true, onboardingCompleted: true };
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

  // ─── Mascot & Costumes ──────────────────────────────────────
  getCostumeCatalog: async (): Promise<CostumeCatalogResponse> => {
    const response = await apiClient.get('/mascot/costumes');
    return response.data;
  },

  purchaseCostume: async (costumeId: string): Promise<PurchaseCostumeResponse> => {
    const response = await apiClient.post('/mascot/costumes/purchase', { costumeId });
    return response.data;
  },

  equipCostume: async (costumeId: string): Promise<EquipCostumeResponse> => {
    const response = await apiClient.post('/mascot/costumes/equip', { costumeId });
    return response.data;
  },

  // ─── Learning Path / DAG ────────────────────────────────────
  getPathTree: async (): Promise<PathTreeResponse> => {
    const response = await apiClient.get('/path/tree');
    return response.data;
  },

  completePathNode: async (
    nodeId: string,
    accuracy: number = 1.0
  ): Promise<{ ok: boolean; nodes: PathNode[] }> => {
    const response = await apiClient.post('/path/complete', { nodeId, accuracy });
    return response.data;
  },
};
