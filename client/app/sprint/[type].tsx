import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../src/api';
import { theme } from '../../src/theme';
import { TimerBar } from '../../src/components/TimerBar';
import { QuestionCard } from '../../src/components/QuestionCard';

export default function ActiveSprintScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    const fetchSprint = async () => {
      try {
        const data = await api.getSprint(type || 'standard');
        setQuestions(data.questions);
      } catch (err) {
        console.error('Error fetching sprint:', err);
      } finally {
        setLoading(false);
        setStartTime(Date.now());
      }
    };
    fetchSprint();
  }, [type]);

  const handleAnswer = async (answer: string) => {
    const timeMs = Date.now() - startTime;
    const currentQ = questions[currentIndex];
    
    const newAnswers = [
      ...answers, 
      { questionId: currentQ.id, answer, timeMs }
    ];
    
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setStartTime(Date.now());
      }, 300); // 300ms flash delay (D-50)
    } else {
      // Finished
      setSubmitting(true);
      try {
        const result = await api.submitSprint({ sprintId: 'mock-id', answers: newAnswers });
        router.replace({
          pathname: '/sprint/results',
          params: { result: JSON.stringify(result) }
        });
      } catch (err) {
        console.error('Error submitting sprint:', err);
        setSubmitting(false);
      }
    }
  };

  const handleTimeUp = () => {
    // Auto-submit null/empty answer on timeout
    handleAnswer('');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (submitting) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.success} />
        <Text style={styles.loadingText}>Analyzing Results...</Text>
      </View>
    );
  }

  const currentQ = questions[currentIndex];
  
  // Default duration to 60s if not specified
  const duration = currentQ.timeLimitMs || 60000;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.progressText}>
          Question {currentIndex + 1} of {questions.length}
        </Text>
      </View>

      <TimerBar 
        key={currentIndex} // Force remount on question change
        durationMs={duration} 
        onTimeUp={handleTimeUp} 
      />

      <QuestionCard 
        question={currentQ}
        onAnswer={handleAnswer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 24,
    paddingTop: 60,
  },
  centered: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.text,
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
