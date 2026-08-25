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
import { api, Question, SprintSession } from '../../api';
import { QuestionCard } from '../../components/QuestionCard';
import { TimerBar } from '../../components/TimerBar';
import { QuizFeedback } from '../../components/QuizFeedback';
import { StreakFlame } from '../../components/StreakFlame';
import { ConfettiOverlay } from '../../components/ConfettiOverlay';
import { SprintyMascot } from '../../components/SprintyMascot';
import { colors, duo } from '../../theme';
import { useFeedback } from '../../services/FeedbackProvider';
import { useMascot } from '../../mascot/MascotContext';

const PER_QUESTION_TIMERS: Record<string, number> = {
  verbal: 30,
  quantitative: 45,
  logical: 40,
  spatial: 35,
};

export default function ActiveSprintScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  const { feedback } = useFeedback();
  const mascot = useMascot();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SprintSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  // Milestone confetti celebration
  const [showConfetti, setShowConfetti] = useState(false);

  // Skip & Hint Mechanics
  const [hintsRemaining, setHintsRemaining] = useState(1);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [activeHintText, setActiveHintText] = useState<string | null>(null);

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
      : answer !== 'TIMEOUT' && answer !== 'SKIPPED';

    setIsLastAnswerCorrect(correct);

    if (correct) {
      mascot.setEmotion('EXCITED_JUMP', 2500);
      const nextStreak = streakCount + 1;
      setStreakCount(nextStreak);

      // Trigger full celebration on milestone (5, 10, etc.)
      if (nextStreak === 5 || (nextStreak > 5 && nextStreak % 5 === 0)) {
        setShowConfetti(true);
        feedback.audio.levelUp();
        feedback.haptics.successNotification();
      }
    } else {
      mascot.setEmotion('SAD_HEADSHAKE', 2500);
      setStreakCount(0);
    }

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
    mascot.setEmotion('SAD_HEADSHAKE', 2500);
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

  const handleUseHint = () => {
    if (hintsRemaining <= 0 || selectedAnswer !== null || showFeedback || !currentQuestion) return;

    feedback.haptics.lightTap();
    feedback.audio.buttonTap();
    setHintsRemaining((prev) => prev - 1);

    // 50/50 Distractor Elimination for MCQs / Spatial options
    const allOptions = currentQuestion.options || [];
    const correct = currentQuestion.correctAnswer;

    if (allOptions.length >= 3) {
      const wrongOptions = allOptions.filter((opt) => opt !== correct);
      // Shuffle & pick 2 distractors to eliminate
      const shuffled = [...wrongOptions].sort(() => Math.random() - 0.5);
      const toEliminate = shuffled.slice(0, 2);
      setEliminatedOptions(toEliminate);
    }

    // Display hint clue / strategy tip
    const hintClue =
      currentQuestion.strategyTip ||
      (currentQuestion.hintLevels?.level1 ?? 'Eliminated 2 incorrect distractors to improve your odds!');
    setActiveHintText(hintClue);
  };

  const handleSkipQuestion = () => {
    if (selectedAnswer !== null || showFeedback || !currentQuestion) return;

    feedback.haptics.mediumTap();
    feedback.audio.buttonTap();

    // Skip question without resetting streak!
    const timeSpent = Math.max(100, Date.now() - questionStartTime.current);
    responsesRef.current.push({
      questionId: currentQuestion._id || currentQuestion.id,
      answer: 'SKIPPED',
      timeMs: timeSpent,
    });

    advanceToNext();
  };

  const advanceToNext = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setEliminatedOptions([]);
    setActiveHintText(null);
    mascot.setEmotion('IDLE_HOVER');

    if (session && currentIndex + 1 < session.questions.length) {
      setCurrentIndex((prev) => prev + 1);
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
        sprintId: session.sprintId || session.id || '',
        responses: responsesRef.current,
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
          <SprintyMascot size="lg" overrideEmotion="IDLE_HOVER" />
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
          <SprintyMascot size="lg" overrideEmotion="EXCITED_JUMP" />
        </Animated.View>
        <Text style={styles.loadingText}>Scoring sprint results...</Text>
      </View>
    );
  }

  const totalQuestions = session.questions.length;
  const progressPct = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Confetti Milestone Celebration Overlay ── */}
      <ConfettiOverlay
        visible={showConfetti}
        streakCount={streakCount}
        onDismiss={() => setShowConfetti(false)}
      />

      {/* ── Top Bar: Close + Progress + Streak Flame + Hearts ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          accessibilityLabel="Close sprint"
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {/* Progress Bar (Duolingo gold) */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>

        {/* Dynamic Streak Flame Counter */}
        <StreakFlame streak={streakCount} />

        {/* Hearts */}
        <View style={styles.heartPill}>
          <Text style={styles.heartIcon}>❤️</Text>
          <Text style={styles.heartCount}>5</Text>
        </View>
      </View>

      {/* ── Dynamic Progress Timer Bar with Mascot Emotion Hook ── */}
      <TimerBar
        key={currentIndex}
        durationSeconds={timerSeconds}
        onTimeOut={handleTimeOut}
        onCriticalThreshold={() => mascot.setEmotion('WORRIED_SWEAT', 6000)}
        isActive={selectedAnswer === null && !showFeedback}
      />

      {/* ── Active Question Card ── */}
      {currentQuestion && (
        <Animated.View style={[styles.questionWrap, questionAnimatedStyle]}>
          <QuestionCard
            question={currentQuestion}
            onAnswer={handleAnswerSubmit}
            selectedAnswer={selectedAnswer}
            eliminatedOptions={eliminatedOptions}
            activeHint={activeHintText}
          />
        </Animated.View>
      )}

      {/* ── Hint & Skip Action Footer ── */}
      {selectedAnswer === null && !showFeedback && (
        <View style={styles.actionFooter}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.hintBtn,
              hintsRemaining <= 0 && styles.actionBtnDisabled,
            ]}
            onPress={handleUseHint}
            disabled={hintsRemaining <= 0}
            accessibilityLabel={`Use hint, ${hintsRemaining} remaining`}
          >
            <Text style={styles.actionBtnText}>
              💡 HINT {hintsRemaining > 0 ? `(${hintsRemaining})` : '(0)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.skipBtn]}
            onPress={handleSkipQuestion}
            accessibilityLabel="Skip question"
          >
            <Text style={[styles.actionBtnText, styles.skipBtnText]}>
              ⏭️ SKIP
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Feedback Banner ── */}
      <QuizFeedback
        visible={showFeedback}
        isCorrect={isLastAnswerCorrect}
        xp_gained={10}
        explanation={currentQuestion?.explanation}
        strategyTip={currentQuestion?.strategyTip}
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

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    height: 14,
    backgroundColor: colors.cardBorder,
    borderRadius: duo.radiusProgress,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.duoGold,
    borderRadius: duo.radiusProgress,
  },
  heartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  heartIcon: {
    fontSize: 15,
  },
  heartCount: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.duoRed,
  },

  // ── Hint & Skip Action Footer ──
  actionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintBtn: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderBottomWidth: 4,
    borderBottomColor: '#D97706',
  },
  skipBtn: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderBottomWidth: 4,
    borderBottomColor: '#94A3B8',
  },
  actionBtnDisabled: {
    opacity: 0.45,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  skipBtnText: {
    color: '#64748B',
  },
});
