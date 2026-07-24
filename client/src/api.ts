import axios from 'axios';

// Default to localhost, configurable via env or host setting
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Question {
  _id: string;
  type: 'mcq' | 'numerical' | 'spatial';
  skill: 'verbal' | 'quantitative' | 'logical' | 'spatial';
  prompt: string;
  options?: string[];
  imageGrid?: string[];
  explanation: string;
  difficulty: number;
}

export interface SprintSession {
  sprintId: string;
  type: 'quick' | 'standard' | 'deep';
  questionCount: number;
  questions: Question[];
}

export interface SprintSubmissionResponse {
  message: string;
  accuracy: number;
  totalCorrect: number;
  totalQuestions: number;
  xpEarned: number;
  totalXp: number;
  streak: {
    currentStreak: number;
    longestStreak: number;
    streakFreezeAvailable: boolean;
    streakFreezeUsed?: boolean;
  };
  leagueId: string;
  timeTotalMs: number;
  ratingsBefore: Record<string, number>;
  ratingsAfter: Record<string, number>;
  ratingDeltas: Record<string, number>;
  results: Array<{
    questionId: string;
    correct: boolean;
    userAnswer: any;
    correctAnswer: any;
    explanation: string;
    timeMs: number;
    skill: string;
  }>;
}

export interface ProgressSkill {
  elo: number;
  score: number; // 0–100
}

export interface ProgressResponse {
  userId: string;
  skills: {
    verbal: ProgressSkill;
    quantitative: ProgressSkill;
    logical: ProgressSkill;
    spatial: ProgressSkill;
  };
}

export interface HistoryPoint {
  date: string;
  accuracy: number;
  avgSpeed: number;
  rating: number;
}

export interface HistoryResponse {
  history: {
    verbal: HistoryPoint[];
    quantitative: HistoryPoint[];
    logical: HistoryPoint[];
    spatial: HistoryPoint[];
  };
}

export interface LeaderboardUser {
  userId: string;
  xp: number;
  rank: number;
}

export interface LeaderboardResponse {
  leagueId: string;
  leaderboard: LeaderboardUser[];
  userRank: {
    rank: number;
    xp: number;
  } | null;
}

export interface UserMeResponse {
  _id: string;
  username: string;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezeAvailable: boolean;
  ratings: Record<string, number>;
  sessionsCompleted: number;
}

export const api = {
  getSprint: async (type: string = 'standard'): Promise<SprintSession> => {
    const res = await client.get(`/api/sprint?type=${type}`);
    return res.data;
  },

  submitSprint: async (
    sprintId: string,
    responses: Array<{ questionId: string; answer: any; timeMs: number }>
  ): Promise<SprintSubmissionResponse> => {
    const res = await client.post('/api/sprint/submit', { sprintId, responses });
    return res.data;
  },

  getProgress: async (): Promise<ProgressResponse> => {
    const res = await client.get('/api/analytics/progress');
    return res.data;
  },

  getHistory: async (): Promise<HistoryResponse> => {
    const res = await client.get('/api/analytics/history');
    return res.data;
  },

  getLeaderboard: async (): Promise<LeaderboardResponse> => {
    const res = await client.get('/api/leaderboard');
    return res.data;
  },

  getUserMe: async (): Promise<UserMeResponse> => {
    const res = await client.get('/api/users/me');
    return res.data;
  },
};
