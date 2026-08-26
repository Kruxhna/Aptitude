import { create } from 'zustand';
import {
  Question,
  SprintSession,
  SprintMode,
  SprintSubmissionResponse,
} from '../api';

export interface QuizResponseRecord {
  questionId: string;
  answer: any;
  timeMs: number;
}

export interface QuizState {
  session: SprintSession | null;
  sprintType: string;
  sprintMode: SprintMode;
  currentIndex: number;
  selectedAnswer: any | null;
  isAnswered: boolean;
  isLastAnswerCorrect: boolean | null;
  sessionStreak: number;
  hintsRemaining: number;
  eliminatedOptions: string[];
  activeHintText: string | null;
  responses: QuizResponseRecord[];
  showFeedback: boolean;
  showConfetti: boolean;
  isSubmitting: boolean;
  isOfflineSession: boolean;
  isPendingSync: boolean;
  submissionResult: SprintSubmissionResponse | null;

  // Actions
  initSession: (session: SprintSession, sprintType?: string, mode?: SprintMode) => void;
  submitOptionAnswer: (
    answer: any,
    timeSpentMs: number
  ) => { isCorrect: boolean; streakCount: number; isMilestone: boolean };
  timeOutQuestion: (timerDurationMs: number) => void;
  useHint: () => { hintText: string | null; eliminated: string[] };
  skipQuestion: (timeSpentMs: number) => void;
  advanceToNextQuestion: () => { isFinished: boolean; nextIndex: number };
  setShowFeedback: (show: boolean) => void;
  setShowConfetti: (show: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setSubmissionResult: (result: SprintSubmissionResponse | null) => void;
  markPendingSync: (isPending: boolean) => void;
  resetQuiz: () => void;
}

const DEFAULT_QUIZ_STATE = {
  session: null,
  sprintType: 'standard',
  sprintMode: 'test' as SprintMode,
  currentIndex: 0,
  selectedAnswer: null,
  isAnswered: false,
  isLastAnswerCorrect: null,
  sessionStreak: 0,
  hintsRemaining: 2,
  eliminatedOptions: [],
  activeHintText: null,
  responses: [],
  showFeedback: false,
  showConfetti: false,
  isSubmitting: false,
  isOfflineSession: false,
  isPendingSync: false,
  submissionResult: null,
};

export const useQuizStore = create<QuizState>((set, get) => ({
  ...DEFAULT_QUIZ_STATE,

  initSession: (session: SprintSession, sprintType = 'standard', mode: SprintMode = 'test') => {
    set({
      session,
      sprintType,
      sprintMode: mode,
      currentIndex: 0,
      selectedAnswer: null,
      isAnswered: false,
      isLastAnswerCorrect: null,
      sessionStreak: 0,
      hintsRemaining: mode === 'learn' ? 5 : 2,
      eliminatedOptions: [],
      activeHintText: null,
      responses: [],
      showFeedback: false,
      showConfetti: false,
      isSubmitting: false,
      isOfflineSession: false,
      isPendingSync: false,
      submissionResult: null,
    });
  },

  submitOptionAnswer: (answer: any, timeSpentMs: number) => {
    const { session, currentIndex, selectedAnswer, showFeedback, sessionStreak, responses } =
      get();

    if (selectedAnswer !== null || showFeedback || !session) {
      return { isCorrect: false, streakCount: sessionStreak, isMilestone: false };
    }

    const currentQuestion: Question | undefined = session.questions[currentIndex];
    const correct =
      currentQuestion?.correctAnswer !== undefined
        ? answer === currentQuestion.correctAnswer
        : answer !== 'TIMEOUT' && answer !== 'SKIPPED';

    const nextStreak = correct ? sessionStreak + 1 : 0;
    const isMilestone = correct && (nextStreak === 5 || (nextStreak > 5 && nextStreak % 5 === 0));

    const nextResponses = [
      ...responses,
      {
        questionId: currentQuestion?._id || currentQuestion?.id || `q_${currentIndex}`,
        answer,
        timeMs: Math.max(100, timeSpentMs),
      },
    ];

    set({
      selectedAnswer: answer,
      isAnswered: true,
      isLastAnswerCorrect: correct,
      sessionStreak: nextStreak,
      showFeedback: true,
      showConfetti: isMilestone,
      responses: nextResponses,
    });

    return { isCorrect: correct, streakCount: nextStreak, isMilestone };
  },

  timeOutQuestion: (timerDurationMs: number) => {
    const { session, currentIndex, selectedAnswer, showFeedback, responses } = get();
    if (selectedAnswer !== null || showFeedback || !session) return;

    const currentQuestion: Question | undefined = session.questions[currentIndex];
    const nextResponses = [
      ...responses,
      {
        questionId: currentQuestion?._id || currentQuestion?.id || `q_${currentIndex}`,
        answer: null,
        timeMs: timerDurationMs,
      },
    ];

    set({
      selectedAnswer: 'TIMEOUT',
      isAnswered: true,
      isLastAnswerCorrect: false,
      sessionStreak: 0,
      showFeedback: true,
      responses: nextResponses,
    });
  },

  useHint: () => {
    const { hintsRemaining, selectedAnswer, showFeedback, session, currentIndex } = get();
    if (hintsRemaining <= 0 || selectedAnswer !== null || showFeedback || !session) {
      return { hintText: null, eliminated: [] };
    }

    const currentQuestion: Question | undefined = session.questions[currentIndex];
    if (!currentQuestion) return { hintText: null, eliminated: [] };

    const allOptions = currentQuestion.options || [];
    const correct = currentQuestion.correctAnswer;
    let newlyEliminated: string[] = [];

    if (allOptions.length >= 3) {
      const wrongOptions = allOptions.filter((opt) => opt !== correct);
      const shuffled = [...wrongOptions].sort(() => Math.random() - 0.5);
      newlyEliminated = shuffled.slice(0, 2);
    }

    const hintClue =
      currentQuestion.strategyTip ||
      currentQuestion.hintLevels?.level1 ||
      'Eliminated 2 incorrect distractors to improve your odds!';

    set({
      hintsRemaining: hintsRemaining - 1,
      eliminatedOptions: newlyEliminated,
      activeHintText: hintClue,
    });

    return { hintText: hintClue, eliminated: newlyEliminated };
  },

  skipQuestion: (timeSpentMs: number) => {
    const { session, currentIndex, selectedAnswer, showFeedback, responses } = get();
    if (selectedAnswer !== null || showFeedback || !session) return;

    const currentQuestion: Question | undefined = session.questions[currentIndex];
    const nextResponses = [
      ...responses,
      {
        questionId: currentQuestion?._id || currentQuestion?.id || `q_${currentIndex}`,
        answer: 'SKIPPED',
        timeMs: Math.max(100, timeSpentMs),
      },
    ];

    set({ responses: nextResponses });
  },

  advanceToNextQuestion: () => {
    const { session, currentIndex } = get();
    const total = session?.questions.length ?? 0;
    const isFinished = !session || currentIndex + 1 >= total;

    set({
      showFeedback: false,
      selectedAnswer: null,
      isAnswered: false,
      eliminatedOptions: [],
      activeHintText: null,
      currentIndex: isFinished ? currentIndex : currentIndex + 1,
    });

    return {
      isFinished,
      nextIndex: isFinished ? currentIndex : currentIndex + 1,
    };
  },

  setShowFeedback: (show: boolean) => set({ showFeedback: show }),
  setShowConfetti: (show: boolean) => set({ showConfetti: show }),
  setSubmitting: (submitting: boolean) => set({ isSubmitting: submitting }),
  setSubmissionResult: (result: SprintSubmissionResponse | null) =>
    set({ submissionResult: result }),
  markPendingSync: (isPending: boolean) => set({ isPendingSync: isPending }),
  resetQuiz: () => set(DEFAULT_QUIZ_STATE),
}));
