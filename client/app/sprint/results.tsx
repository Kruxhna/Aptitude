import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../src/theme';
import { SkillBadge } from '../../src/components/SkillBadge';
import { SymbolView } from 'expo-symbols';

export default function ResultsScreen() {
  const { result } = useLocalSearchParams<{ result: string }>();
  const router = useRouter();

  let data: any = null;
  try {
    data = result ? JSON.parse(result) : null;
  } catch (e) {
    console.error('Failed to parse result data', e);
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>No result data available.</Text>
        <TouchableOpacity style={styles.doneButton} onPress={() => router.replace('/')}>
          <Text style={styles.doneButtonText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { session, results } = data;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Sprint Complete!</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Accuracy</Text>
              <Text style={styles.statValue}>{Math.round((session.correctCount / session.totalQuestions) * 100)}%</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>XP Earned</Text>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>+{session.xpEarned}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Performance Deltas</Text>
        <View style={styles.deltasContainer}>
          {Object.entries(session.ratingDeltas || {}).map(([skill, delta]: [string, any]) => (
            <View key={skill} style={styles.deltaRow}>
              <SkillBadge skill={skill as any} />
              <Text style={[styles.deltaText, { color: delta >= 0 ? theme.colors.success : theme.colors.error }]}>
                {delta >= 0 ? '+' : ''}{delta} ELO
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Question Review</Text>
        {results?.map((res: any, index: number) => (
          <View key={index} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewQNum}>Q{index + 1}</Text>
              <SymbolView 
                name={res.isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill"} 
                tintColor={res.isCorrect ? theme.colors.success : theme.colors.error} 
                size={24} 
              />
            </View>
            <Text style={styles.reviewPrompt}>{res.question.prompt}</Text>
            
            <View style={styles.answerRow}>
              <Text style={styles.answerLabel}>Your Answer:</Text>
              <Text style={[styles.answerText, { color: res.isCorrect ? theme.colors.success : theme.colors.error }]}>
                {res.userAnswer || 'Skipped'}
              </Text>
            </View>

            {!res.isCorrect && (
              <View style={styles.answerRow}>
                <Text style={styles.answerLabel}>Correct Answer:</Text>
                <Text style={[styles.answerText, { color: theme.colors.success }]}>
                  {res.correctAnswer}
                </Text>
              </View>
            )}

            <Text style={styles.explanation}>{res.question.explanation}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.doneButton} onPress={() => router.replace('/')}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: 20,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 8,
  },
  deltasContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  deltaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deltaText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewQNum: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewPrompt: {
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  answerRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  answerLabel: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  answerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  explanation: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
