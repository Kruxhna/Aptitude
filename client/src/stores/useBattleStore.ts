import { create } from 'zustand';
import { Question } from '../api';

export type BattleStatus = 'IDLE' | 'SEARCHING' | 'MATCHED' | 'IN_BATTLE' | 'GAME_OVER' | 'OPPONENT_DISCONNECTED';

export interface BattleOpponent {
  displayName: string;
  elo: number;
  costume?: string;
}

export interface BattleState {
  status: BattleStatus;
  battleId: string | null;
  opponent: BattleOpponent | null;
  questions: Question[];
  currentQuestionIndex: number;
  selectedAnswer: string | number | null;
  myScore: number;
  opponentScore: number;
  myProgress: number;
  opponentProgress: number;
  isWinner: boolean | null;
  isDraw: boolean;
  eloDelta: number;
  gemsEarned: number;
  forfeitCountdown: number | null;

  // Actions
  setSearching: () => void;
  setMatched: (battleId: string, opponent: BattleOpponent, questions: Question[]) => void;
  submitBattleAnswer: (answer: string | number) => void;
  updateLiveScores: (myScore: number, opponentScore: number, myProgress: number, opponentProgress: number) => void;
  advanceQuestion: () => void;
  setOpponentDisconnected: (timeoutSec: number) => void;
  setGameOver: (result: { isWinner: boolean; isDraw: boolean; eloDelta: number; gemsEarned: number }) => void;
  resetBattle: () => void;
}

export const useBattleStore = create<BattleState>((set, get) => ({
  status: 'IDLE',
  battleId: null,
  opponent: null,
  questions: [],
  currentQuestionIndex: 0,
  selectedAnswer: null,
  myScore: 0,
  opponentScore: 0,
  myProgress: 0,
  opponentProgress: 0,
  isWinner: null,
  isDraw: false,
  eloDelta: 0,
  gemsEarned: 0,
  forfeitCountdown: null,

  setSearching: () => set({ status: 'SEARCHING' }),

  setMatched: (battleId, opponent, questions) =>
    set({
      status: 'MATCHED',
      battleId,
      opponent,
      questions,
      currentQuestionIndex: 0,
      selectedAnswer: null,
      myScore: 0,
      opponentScore: 0,
      myProgress: 0,
      opponentProgress: 0,
      isWinner: null,
      isDraw: false,
      eloDelta: 0,
      gemsEarned: 0,
      forfeitCountdown: null,
    }),

  submitBattleAnswer: (answer) => set({ selectedAnswer: answer }),

  updateLiveScores: (myScore, opponentScore, myProgress, opponentProgress) =>
    set({ myScore, opponentScore, myProgress, opponentProgress }),

  advanceQuestion: () => {
    const nextIdx = get().currentQuestionIndex + 1;
    set({ currentQuestionIndex: nextIdx, selectedAnswer: null });
  },

  setOpponentDisconnected: (timeoutSec) =>
    set({ status: 'OPPONENT_DISCONNECTED', forfeitCountdown: timeoutSec }),

  setGameOver: ({ isWinner, isDraw, eloDelta, gemsEarned }) =>
    set({
      status: 'GAME_OVER',
      isWinner,
      isDraw,
      eloDelta,
      gemsEarned,
      forfeitCountdown: null,
    }),

  resetBattle: () =>
    set({
      status: 'IDLE',
      battleId: null,
      opponent: null,
      questions: [],
      currentQuestionIndex: 0,
      selectedAnswer: null,
      myScore: 0,
      opponentScore: 0,
      myProgress: 0,
      opponentProgress: 0,
      isWinner: null,
      isDraw: false,
      eloDelta: 0,
      gemsEarned: 0,
      forfeitCountdown: null,
    }),
}));
