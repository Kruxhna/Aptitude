import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
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
import { api, Question, SprintSession } from '../../api';
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
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SprintSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  // Feedback banner state
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLastAnswerCorrect, setIsLastAnswerCorrect] = useState(true);

  // Horizontal fade-in animation for questions
  const questionOpacity = useSharedValue(1);
  const questionTranslateX = useSharedValue(0);

  const responsesRef = useRef<Array<{ questionId: string; answer: any; timeMs: number }>>([]);
  const questionStartTime = useRef<number>(Date.now());

  useEffect(() => {
    fetchSprint();
  }, [type]);

  const triggerQuestionEntryAnimation = () => {
    questionOpacity.value = 0;
    questionTranslateX.value = 80;
    questionOpacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) });
    questionTranslateX.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) });
  };

  const fetchSprint = async () => {
    try {
      setLoading(true);
      const data = await api.getSprint(type || 'standard');
      setSession(data);
      questionStartTime.current = Date.now();
      triggerQuestionEntryAnimation();
    } catch (err: any) {
      // Silently fail, loading state will show
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion: Question | undefined = session?.questions[currentIndex];
  const timerSeconds = currentQuestion
    ? PER_QUESTION_TIMERS[currentQuestion.skill] || 30
    : 30;

  const handleAnswerSubmit = (answer: any) => {
    if (selectedAnswer !== null || showFeedback) return;

    setSelectedAnswer(answer);
    const timeSpent = Math.max(100, Date.now() - questionStartTime.current);

    const correct = currentQuestion?.correctAnswer !== undefined
      ? answer === currentQuestion.correctAnswer
      : answer !== 'TIMEOUT';

    setIsLastAnswerCorrect(correct);
    setStreakCount(prev => correct ? prev + 1 : 0);
    setShowFeedback(true);

    if (currentQuestion) {
      responsesRef.current.push({
        questionId: currentQuestion._id || currentQuestion.id,
        answer,
        timeMs: timeSpent,
      });
    }
  };

  const handleTimeOut = () => {
    if (selectedAnswer !== null || showFeedback) return;

    setSelectedAnswer('TIMEOUT');
    setIsLastAnswerCorrect(false);
    setStreakCount(0);
    setShowFeedback(true);

    if (currentQuestion) {
      responsesRef.current.push({
        questionId: currentQuestion._id || currentQuestion.id,
        answer: null,
        timeMs: timerSeconds * 1000,
      });
    }
  };

  const advanceToNext = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);

    if (session && currentIndex + 1 < session.questions.length) {
      setCurrentIndex(prev => prev + 1);
      questionStartTime.current = Date.now();
      triggerQuestionEntryAnimation();
    } else {
      finishSprint();
    }
  };

  const finishSprint = async () => {
    if (!session || submitting) return;
    try {
      setSubmitting(true);
      const submissionResult = await api.submitSprint({
        sprintId: session.sprintId || session.id,
        answers: responsesRef.current,
      } as any);

      router.replace({
        pathname: '/sprint/results' as any,
        params: { data: JSON.stringify(submissionResult) },
      });
    } catch {
      setSubmitting(false);
    }
  };

  const questionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: questionOpacity.value,
    transform: [{ translateX: questionTranslateX.value }],
  }));

  // Loading hover animation
  const loadingHoverY = useSharedValue(0);

  useEffect(() => {
    if (loading || submitting) {
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
  }, [loading, submitting]);

  const loadingAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: loadingHoverY.value }],
  }));

  // ── Loading State ──
  if (loading || !session) {
    return (
      <View style={styles.centerContainer}>
        <Animated.View style={[styles.loadingRobot, loadingAnimStyle]}>
          <SpriteAnimator
            source={require('../../../assets/sprites/sprinty_idle_hover_sprite.png')}
            style={styles.robotSprite}
            frameCount={4}
            fps={8}
          />
        </Animated.View>
        <Text style={styles.loadingText}>Fetching next questions...</Text>
      </View>
    );
  }

  // ── Submitting State ──
  if (submitting) {
    return (
      <View style={styles.centerContainer}>
        <Animated.View style={[styles.loadingRobot, loadingAnimStyle]}>
          <SpriteAnimator
            source={require('../../../assets/sprites/sprinty_idle_hover_sprite.png')}
            style={styles.robotSprite}
            frameCount={4}
            fps={8}
          />
        </Animated.View>
        <Text style={styles.loadingText}>Scoring sprint results...</Text>
      </View>
    );
  }

  const totalQuestions = session.questions.length;
  const progressPct = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Duolingo Top Bar: Close + Progress + Hearts ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {/* Progress Bar (Duolingo gold) */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>

        {/* Streak Counter */}
        {streakCount > 0 && (
          <View style={styles.streakPill}>
            <Text style={styles.streakText}>{streakCount} 🔥</Text>
          </View>
        )}

        {/* Hearts */}
        <View style={styles.heartPill}>
          <Text style={styles.heartIcon}>❤️</Text>
          <Text style={styles.heartCount}>5</Text>
        </View>
      </View>

      {/* ── Timer Bar ── */}
      <TimerBar
        key={currentIndex}
        durationSeconds={timerSeconds}
        onTimeOut={handleTimeOut}
        isActive={selectedAnswer === null && !showFeedback}
      />

      {/* ── Question Card ── */}
      {currentQuestion && (
        <Animated.View style={[styles.questionWrap, questionAnimatedStyle]}>
          <QuestionCard
            question={currentQuestion}
            onAnswer={handleAnswerSubmit}
            selectedAnswer={selectedAnswer}
          />
        </Animated.View>
      )}

      {/* ── Feedback Banner ── */}
      <QuizFeedback
        visible={showFeedback}
        isCorrect={isLastAnswerCorrect}
        xp_gained={10}
        explanation={currentQuestion?.explanation}
        onContinue={advanceToNext}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  questionWrap: {
    flex: 1,
    width: '100%',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 20,
    fontSize: 16,
    fontWeight: '700',
  },
  loadingRobot: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  robotSprite: {
    width: 90,
    height: 90,
  },

  // ── Duolingo Top Bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textMuted,
  },
  progressTrack: {
    flex: 1,
    height: 16,
    backgroundColor: colors.cardBorder,
    borderRadius: duo.radiusProgress,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.duoGold,
    borderRadius: duo.radiusProgress,
  },
  streakPill: {
    backgroundColor: '#FFF4CC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: duo.radiusPill,
  },
  streakText: {
    fontSize: duo.fontCaption,
    fontWeight: '700',
    color: '#E5B300',
  },
  heartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heartIcon: {
    fontSize: 18,
  },
  heartCount: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.duoRed,
  },
});
