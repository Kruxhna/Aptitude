import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SprintSubmissionResponse } from '../../api';
import { SkillBadge } from '../../components/SkillBadge';
import { colors } from '../../theme';

export default function SprintResultsScreen() {
  const { data } = useLocalSearchParams<{ data: string }>();
  const router = useRouter();

  let resultsData: SprintSubmissionResponse | null = null;
  try {
    if (data) {
      resultsData = JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to parse results data:', e);
  }

  if (!resultsData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No results data found.</Text>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.replace('/(tabs)' as any)}
        >
          <Text style={styles.doneButtonText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const accuracyPct = Math.round((resultsData.accuracy || 0) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Summary Card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Sprint Complete!</Text>
        <Text style={styles.accuracyNumber}>{accuracyPct}%</Text>
        <Text style={styles.heroSubtitle}>
          {resultsData.totalCorrect} of {resultsData.totalQuestions} Correct
        </Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>+{resultsData.xpEarned}</Text>
            <Text style={styles.metricLabel}>XP Earned</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              🔥 {resultsData.streak?.currentStreak || 1}
            </Text>
            <Text style={styles.metricLabel}>Day Streak</Text>
          </View>
        </View>
      </View>

      {/* Skill ELO Rating Deltas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skill ELO Adjustments</Text>
        <View style={styles.deltasGrid}>
          {Object.entries(resultsData.ratingDeltas || {}).map(
            ([skill, delta]) => {
              const isPositive = delta > 0;
              const isNegative = delta < 0;
              return (
                <View key={skill} style={styles.deltaCard}>
                  <SkillBadge skill={skill} size="small" />
                  <Text
                    style={[
                      styles.deltaValue,
                      isPositive && styles.deltaPositive,
                      isNegative && styles.deltaNegative,
                    ]}
                  >
                    {isPositive ? `+${delta}` : delta === 0 ? '0' : `${delta}`} ELO
                  </Text>
                </View>
              );
            }
          )}
        </View>
      </View>

      {/* Answer Review Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Answer Review</Text>
        {resultsData.results.map((item, idx) => (
          <View
            key={idx}
            style={[
              styles.reviewCard,
              item.correct ? styles.correctBorder : styles.incorrectBorder,
            ]}
          >
            <View style={styles.reviewHeader}>
              <Text
                style={[
                  styles.reviewStatus,
                  item.correct ? styles.textCorrect : styles.textIncorrect,
                ]}
              >
                {item.correct ? '✓ Correct' : '✗ Incorrect'} ({Math.round(item.timeMs / 1000)}s)
              </Text>
              <SkillBadge skill={item.skill || 'verbal'} size="small" />
            </View>

            <Text style={styles.reviewDetailText}>
              <Text style={styles.labelBold}>Your answer: </Text>
              {String(item.userAnswer ?? 'No response')}
            </Text>

            {!item.correct && (
              <Text style={styles.reviewDetailText}>
                <Text style={styles.labelBold}>Correct answer: </Text>
                {String(item.correctAnswer)}
              </Text>
            )}

            {item.explanation && (
              <View style={styles.explanationBox}>
                <Text style={styles.explanationTitle}>Explanation:</Text>
                <Text style={styles.explanationText}>{item.explanation}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.doneButton}
        activeOpacity={0.85}
        onPress={() => router.replace('/(tabs)' as any)}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    marginBottom: 16,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  accuracyNumber: {
    color: colors.accent,
    fontSize: 52,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  heroSubtitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.cardBorder,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  deltasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  deltaCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deltaValue: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },
  deltaPositive: {
    color: colors.success,
  },
  deltaNegative: {
    color: colors.danger,
  },
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 12,
  },
  correctBorder: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  incorrectBorder: {
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewStatus: {
    fontSize: 14,
    fontWeight: '700',
  },
  textCorrect: {
    color: colors.success,
  },
  textIncorrect: {
    color: colors.danger,
  },
  reviewDetailText: {
    color: colors.text,
    fontSize: 14,
    marginTop: 4,
  },
  labelBold: {
    fontWeight: '700',
    color: colors.textMuted,
  },
  explanationBox: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  explanationTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  explanationText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  doneButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
});
