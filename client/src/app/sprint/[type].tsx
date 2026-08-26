import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { api, Question, SprintMode, SprintSubmissionResponse } from '../../api';
import { useQuizStore } from '../../stores/useQuizStore';
import { useUserStore } from '../../stores/useUserStore';
import { enqueueOfflineSprint, isNetworkOnline } from '../../services/syncQueue';
import { QuestionCard } from '../../components/QuestionCard';
import { TimerBar } from '../../components/TimerBar';
import { QuizFeedback } from '../../components/QuizFeedback';
import { SpriteAnimator } from '../../components/SpriteAnimator';
import { colors, duo } from '../../theme';

const PER_QUESTION_TIMERS: Record<string, number> = {
  verbal: 30,
  quantitative: 45,
  logical: 40,
  spatial: 35,
};

export default function ActiveSprintScreen() {
  const { type, mode: paramMode } = useLocalSearchParams<{ type: string; mode?: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [offlineToastVisible, setOfflineToastVisible] = useState(false);

  // Granular atomic Zustand selectors
  const session = useQuizStore((s) => s.session);
  const currentIndex = useQuizStore((s) => s.currentIndex);
  const selectedAnswer = useQuizStore((s) => s.selectedAnswer);
  const isAnswered = useQuizStore((s) => s.isAnswered);
  const isLastAnswerCorrect = useQuizStore((s) => s.isLastAnswerCorrect);
  const sessionStreak = useQuizStore((s) => s.sessionStreak);
  const hintsRemaining = useQuizStore((s) => s.hintsRemaining);
  const eliminatedOptions = useQuizStore((s) => s.eliminatedOptions);
  const activeHintText = useQuizStore((s) => s.activeHintText);
  const showFeedback = useQuizStore((s) => s.showFeedback);
  const isSubmitting = useQuizStore((s) => s.isSubmitting);
  const responses = useQuizStore((s) => s.responses);

  // Actions
  const initSession = useQuizStore((s) => s.initSession);
  const submitOptionAnswer = useQuizStore((s) => s.submitOptionAnswer);
  const timeOutQuestion = useQuizStore((s) => s.timeOutQuestion);
  const useHint = useQuizStore((s) => s.useHint);
  const skipQuestion = useQuizStore((s) => s.skipQuestion);
  const advanceToNextQuestion = useQuizStore((s) => s.advanceToNextQuestion);
  const setSubmitting = useQuizStore((s) => s.setSubmitting);
  const setSubmissionResult = useQuizStore((s) => s.setSubmissionResult);

  // Horizontal fade-in animation for questions
  const questionOpacity = useSharedValue(1);
  const questionTranslateX = useSharedValue(0);
  const questionStartTime = useRef<number>(Date.now());

  useEffect(() => {
    fetchSprint();
  }, [type, paramMode]);

  const triggerQuestionEntryAnimation = () => {
    questionOpacity.value = 0;
    questionTranslateX.value = 60;
    questionOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
    questionTranslateX.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) });
  };

  const fetchSprint = async () => {
    try {
      setLoading(true);
      const sprintMode = (paramMode === 'learn' ? 'learn' : 'test') as SprintMode;
      const data = await api.getSprint(type || 'standard', sprintMode);
      initSession(data, type || 'standard', sprintMode);
      questionStartTime.current = Date.now();
      triggerQuestionEntryAnimation();
    } catch (err: any) {
      console.warn('[ActiveSprintScreen] Error loading sprint:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion: Question | undefined = session?.questions[currentIndex];
  const timerSeconds = currentQuestion
    ? PER_QUESTION_TIMERS[currentQuestion.skill] || 30
    : 30;

  const handleAnswerSubmit = (answer: any) => {
    if (selectedAnswer !== null || showFeedback || isAnswered) return;
    const timeSpent = Math.max(100, Date.now() - questionStartTime.current);
    submitOptionAnswer(answer, timeSpent);
  };

  const handleTimeOut = () => {
    if (selectedAnswer !== null || showFeedback || isAnswered) return;
    timeOutQuestion(timerSeconds * 1000);
  };

  const handleUseHint = () => {
    if (hintsRemaining <= 0 || selectedAnswer !== null || showFeedback) return;
    useHint();
  };

  const handleSkipQuestion = () => {
    if (selectedAnswer !== null || showFeedback) return;
    const timeSpent = Math.max(100, Date.now() - questionStartTime.current);
    skipQuestion(timeSpent);
    handleAdvance();
  };

  const handleAdvance = () => {
    const { isFinished } = advanceToNextQuestion();
    if (isFinished) {
      finishSprint();
    } else {
      questionStartTime.current = Date.now();
      triggerQuestionEntryAnimation();
    }
  };

  const finishSprint = async () => {
    if (!session || isSubmitting) return;

    try {
      setSubmitting(true);
      const online = await isNetworkOnline();

      if (!online) {
        // Offline flow: Package to offline queue and compute local optimistic submission
        const totalCorrect = responses.filter((r) => {
          const q = session.questions.find(
            (item) => item._id === r.questionId || item.id === r.questionId
          );
          return q?.correctAnswer !== undefined ? r.answer === q.correctAnswer : false;
        }).length;

        const totalQ = session.questions.length;
        const accuracy = totalQ > 0 ? totalCorrect / totalQ : 0;
        const xpEarned = totalCorrect * 15;

        await enqueueOfflineSprint({
          sprintId: session.sprintId || session.id || `sprint_${Date.now()}`,
          type: type || 'standard',
          responses,
          totalQuestions: totalQ,
          totalCorrect,
          optimisticXp: xpEarned,
        });

        const offlineResult: SprintSubmissionResponse = {
          message: 'Completed Offline — Queued for sync',
          mode: 'test',
          accuracy,
          totalCorrect,
          totalQuestions: totalQ,
          xpEarned,
          xpMultiplier: 1.0,
          xpTotal: useUserStore.getState().totalXp,
          streak: {
            current: useUserStore.getState().currentStreak,
            freezesAvailable: 1,
          },
          eloBefore: useUserStore.getState().elo,
          eloAfter: useUserStore.getState().elo,
          eloDeltas: {},
          ratingDeltas: {},
          results: session.questions.map((q, idx) => {
            const resp = responses[idx];
            const correct =
              q.correctAnswer !== undefined ? resp?.answer === q.correctAnswer : false;
            return {
              questionId: q._id || q.id,
              correct,
              userAnswer: resp?.answer ?? 'N/A',
              correctAnswer: q.correctAnswer ?? 'N/A',
              explanation: q.explanation || 'Reviewed offline.',
              timeMs: resp?.timeMs || 5000,
              skill: q.skill,
              strategyTip: q.strategyTip,
            };
          }),
        };

        setSubmissionResult(offlineResult);
        setOfflineToastVisible(true);

        setTimeout(() => {
          setSubmitting(false);
          router.replace({
            pathname: '/sprint/results' as any,
            params: { data: JSON.stringify(offlineResult) },
          });
        }, 800);
        return;
      }

      // Online flow
      const submissionResult = await api.submitSprint({
        sprintId: session.sprintId || session.id || '',
        responses,
      });

      // Update user store with confirmed backend stats
      if (submissionResult.xpTotal) {
        useUserStore.getState().setUserFromResponse({
          xpTotal: submissionResult.xpTotal,
          streak: submissionResult.streak,
          elo: submissionResult.eloAfter,
        });
      }

      setSubmissionResult(submissionResult);
      setSubmitting(false);

      router.replace({
        pathname: '/sprint/results' as any,
        params: { data: JSON.stringify(submissionResult) },
      });
    } catch (err) {
      console.warn('[finishSprint] API error, saving to offline queue:', err);
      const totalCorrect = responses.filter((r) => {
        const q = session.questions.find(
          (item) => item._id === r.questionId || item.id === r.questionId
        );
        return q?.correctAnswer !== undefined ? r.answer === q.correctAnswer : false;
      }).length;

      const totalQ = session.questions.length;
      const accuracy = totalQ > 0 ? totalCorrect / totalQ : 0;
      const xpEarned = totalCorrect * 15;

      await enqueueOfflineSprint({
        sprintId: session.sprintId || session.id || `sprint_${Date.now()}`,
        type: type || 'standard',
        responses,
        totalQuestions: totalQ,
        totalCorrect,
        optimisticXp: xpEarned,
      });

      const fallbackResult: SprintSubmissionResponse = {
        message: 'Saved offline — syncing when back online',
        mode: 'test',
        accuracy,
        totalCorrect,
        totalQuestions: totalQ,
        xpEarned,
        xpMultiplier: 1.0,
        xpTotal: useUserStore.getState().totalXp,
        streak: {
          current: useUserStore.getState().currentStreak,
          freezesAvailable: 1,
        },
        eloBefore: useUserStore.getState().elo,
        eloAfter: useUserStore.getState().elo,
        eloDeltas: {},
        ratingDeltas: {},
        results: session.questions.map((q, idx) => {
          const resp = responses[idx];
          const correct =
            q.correctAnswer !== undefined ? resp?.answer === q.correctAnswer : false;
          return {
            questionId: q._id || q.id,
            correct,
            userAnswer: resp?.answer ?? 'N/A',
            correctAnswer: q.correctAnswer ?? 'N/A',
            explanation: q.explanation || 'Reviewed offline.',
            timeMs: resp?.timeMs || 5000,
            skill: q.skill,
            strategyTip: q.strategyTip,
          };
        }),
      };

      setSubmissionResult(fallbackResult);
      setSubmitting(false);

      router.replace({
        pathname: '/sprint/results' as any,
        params: { data: JSON.stringify(fallbackResult) },
      });
    }
  };

  const questionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: questionOpacity.value,
    transform: [{ translateX: questionTranslateX.value }],
  }));

  const loadingHoverY = useSharedValue(0);

  useEffect(() => {
    if (loading || isSubmitting) {
      loadingHoverY.value = withRepeat(
        withSequence(
          withTiming(-15, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    } else {
      loadingHoverY.value = 0;
    }
  }, [loading, isSubmitting]);

  const loadingAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: loadingHoverY.value }],
  }));

  // ── Loading State ──
  if (loading || !session) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Animated.View style={[styles.loadingRobot, loadingAnimStyle]}>
          <SpriteAnimator
            source={require('../../../assets/sprites/sprinty_idle_hover_sprite.png')}
            frameCount={4}
            fps={8}
            style={{ width: 80, height: 80 }}
          />
        </Animated.View>
        <Text style={styles.loadingText}>Fetching next questions...</Text>
      </View>
    );
  }

  // ── Submitting State ──
  if (isSubmitting) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Animated.View style={[styles.loadingRobot, loadingAnimStyle]}>
          <SpriteAnimator
            source={require('../../../assets/sprites/sprinty_correct_jump_sprite.png')}
            frameCount={4}
            fps={10}
            style={{ width: 80, height: 80 }}
          />
        </Animated.View>
        <Text style={styles.loadingText}>
          {offlineToastVisible ? 'Saving locally for background sync...' : 'Scoring sprint results...'}
        </Text>
      </View>
    );
  }

  const totalQuestions = session.questions.length;
  const progressPct = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Top Bar: Close + Progress + Streak Flame + Hints ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          accessibilityLabel="Close sprint"
          accessibilityRole="button"
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {/* Duolingo Rounded Progress Pill */}
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              { width: `${progressPct}%`, backgroundColor: colors.duoGreen },
            ]}
          />
        </View>

        {/* Streak Counter Pill */}
        <View style={styles.streakWrap}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>{sessionStreak}</Text>
        </View>
      </View>

      {/* ── Top Auxiliary Actions: 50/50 Hint & Skip ── */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[
            styles.hintBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
            hintsRemaining <= 0 && { opacity: 0.4 },
          ]}
          onPress={handleUseHint}
          disabled={hintsRemaining <= 0 || selectedAnswer !== null || showFeedback}
          accessible={true}
          accessibilityLabel={`Use 50/50 hint. ${hintsRemaining} remaining.`}
          accessibilityRole="button"
        >
          <Text style={styles.hintBtnIcon}>💡</Text>
          <Text style={styles.hintBtnText}>50/50 ({hintsRemaining})</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.skipBtn,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            (selectedAnswer !== null || showFeedback) && { opacity: 0.4 },
          ]}
          onPress={handleSkipQuestion}
          disabled={selectedAnswer !== null || showFeedback}
          accessible={true}
          accessibilityLabel="Skip question"
          accessibilityRole="button"
        >
          <Text style={styles.skipBtnText}>Skip ↷</Text>
        </TouchableOpacity>
      </View>

      {/* ── Main Content Area ── */}
      <View style={styles.content}>
        {/* Animated Timer Bar */}
        <View style={styles.timerWrap}>
          <TimerBar
            key={`timer_${currentIndex}`}
            durationSeconds={timerSeconds}
            isPaused={selectedAnswer !== null || showFeedback}
            isActive={!loading && !isSubmitting}
            onTimeOut={handleTimeOut}
          />
        </View>

        {/* Horizontal Slide Animated Question Container */}
        <Animated.View style={[styles.questionArea, questionAnimatedStyle]}>
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              onAnswer={handleAnswerSubmit}
              selectedAnswer={selectedAnswer}
              eliminatedOptions={eliminatedOptions}
              activeHint={activeHintText}
            />
          )}
        </Animated.View>
      </View>

      {/* ── Immediate Per-Option Quiz Feedback Modal ── */}
      <QuizFeedback
        visible={showFeedback}
        isCorrect={Boolean(isLastAnswerCorrect)}
        xp_gained={isLastAnswerCorrect ? 15 : 0}
        strategyTip={currentQuestion?.strategyTip}
        explanation={currentQuestion?.explanation}
        onContinue={handleAdvance}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingRobot: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    color: colors.text,
  },

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textMuted,
  },
  progressTrack: {
    flex: 1,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 7,
  },
  streakWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundElement,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    gap: 4,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF9600',
  },

  // ── Action Row (Hints / Skip) ──
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 2,
    marginBottom: 4,
  },
  hintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    gap: 4,
  },
  hintBtnIcon: {
    fontSize: 13,
  },
  hintBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderBottomWidth: 3,
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
  },

  // ── Content ──
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  timerWrap: {
    width: '100%',
    marginBottom: 6,
  },
  questionArea: {
    flex: 1,
  },
});
