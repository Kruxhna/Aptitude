import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
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
import { colors } from '../../theme';

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
      Alert.alert('Error', err.message || 'Failed to load sprint questions');
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
    const timeSpent = timerSeconds * 1000;

    setIsLastAnswerCorrect(false);
    setShowFeedback(true);

    if (currentQuestion) {
      responsesRef.current.push({
        questionId: currentQuestion._id || currentQuestion.id,
        answer: null,
        timeMs: timeSpent,
      });
    }
  };

  const advanceToNext = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);

    if (session && currentIndex + 1 < session.questions.length) {
      setCurrentIndex(prev => prev + 1);
      questionStartTime.current = Date.now();
      triggerQuestionEntryAnimation(); // Trigger horizontal fade-in for next question
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
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit sprint');
      setSubmitting(false);
    }
  };

  const questionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: questionOpacity.value,
    transform: [{ translateX: questionTranslateX.value }],
  }));

  // Simple idle hover for loading states
  const loadingHoverY = useSharedValue(0);

  useEffect(() => {
    if (loading || submitting) {
      loadingHoverY.value = withRepeat(
        withSequence(
          withTiming(-15, { duration: 1000, easing: Easing.inOut(Easing.sine) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.sine) })
        ),
        -1, // infinite loop
        false // no reverse
      );
    } else {
      loadingHoverY.value = 0;
    }
  }, [loading, submitting]);

  const loadingAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: loadingHoverY.value }],
  }));

  if (loading || !session) {
    return (
      <View style={styles.centerContainer}>
        <Animated.View style={[styles.loadingRobotContainer, loadingAnimatedStyle]}>
          <Image
            source={require('../../../assets/sprites/sprinty_idle_hover_sprite.png')}
            style={styles.loadingRobotSprite}
            resizeMode="contain"
          />
        </Animated.View>
        <Text style={styles.loadingText}>Fetching next questions...</Text>
      </View>
    );
  }

  if (submitting) {
    return (
      <View style={styles.centerContainer}>
        <Animated.View style={[styles.loadingRobotContainer, loadingAnimatedStyle]}>
          <Image
            source={require('../../../assets/sprites/sprinty_idle_hover_sprite.png')}
            style={styles.loadingRobotSprite}
            resizeMode="contain"
          />
        </Animated.View>
        <Text style={styles.loadingText}>Scoring sprint results...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>
          Question {currentIndex + 1} of {session.questions.length}
        </Text>
        <Text style={styles.typeBadge}>
          {(type || 'standard').toUpperCase()}
        </Text>
      </View>

      <TimerBar
        key={currentIndex}
        durationSeconds={timerSeconds}
        onTimeOut={handleTimeOut}
        isActive={selectedAnswer === null && !showFeedback}
      />

      {currentQuestion && (
        <Animated.View style={[styles.questionWrapper, questionAnimatedStyle]}>
          <QuestionCard
            question={currentQuestion}
            onAnswer={handleAnswerSubmit}
            selectedAnswer={selectedAnswer}
          />
        </Animated.View>
      )}

      {/* Quiz Feedback Bottom Banner */}
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
  questionWrapper: {
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
    fontWeight: '600',
  },
  loadingRobotContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingRobotSprite: {
    width: 90,
    height: 90,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  typeBadge: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
