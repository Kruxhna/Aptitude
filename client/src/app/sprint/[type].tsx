import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api, Question, SprintSession } from '../../api';
import { QuestionCard } from '../../components/QuestionCard';
import { TimerBar } from '../../components/TimerBar';
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

  const responsesRef = useRef<Array<{ questionId: string; answer: any; timeMs: number }>>([]);
  const questionStartTime = useRef<number>(Date.now());

  useEffect(() => {
    fetchSprint();
  }, [type]);

  const fetchSprint = async () => {
    try {
      setLoading(true);
      const data = await api.getSprint(type || 'standard');
      setSession(data);
      questionStartTime.current = Date.now();
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
    if (selectedAnswer !== null) return; // Prevent double-tap

    setSelectedAnswer(answer);
    const timeSpent = Math.max(100, Date.now() - questionStartTime.current);

    if (currentQuestion) {
      responsesRef.current.push({
        questionId: currentQuestion._id,
        answer,
        timeMs: timeSpent,
      });
    }

    // Auto-advance after 300ms flash (D-50)
    setTimeout(() => {
      advanceToNext();
    }, 300);
  };

  const handleTimeOut = () => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer('TIMEOUT');
    const timeSpent = timerSeconds * 1000;

    if (currentQuestion) {
      responsesRef.current.push({
        questionId: currentQuestion._id,
        answer: null,
        timeMs: timeSpent,
      });
    }

    setTimeout(() => {
      advanceToNext();
    }, 300);
  };

  const advanceToNext = () => {
    setSelectedAnswer(null);

    if (session && currentIndex + 1 < session.questions.length) {
      setCurrentIndex(prev => prev + 1);
      questionStartTime.current = Date.now();
    } else {
      finishSprint();
    }
  };

  const finishSprint = async () => {
    if (!session || submitting) return;
    try {
      setSubmitting(true);
      const submissionResult = await api.submitSprint(
        session.sprintId,
        responsesRef.current
      );

      // Navigate to results screen with serialized result
      router.replace({
        pathname: '/sprint/results' as any,
        params: { data: JSON.stringify(submissionResult) },
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit sprint');
      setSubmitting(false);
    }
  };

  if (loading || !session) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading sprint questions...</Text>
      </View>
    );
  }

  if (submitting) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
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
        isActive={selectedAnswer === null}
      />

      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          onAnswer={handleAnswerSubmit}
          selectedAnswer={selectedAnswer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
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
    marginTop: 12,
    fontSize: 16,
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
