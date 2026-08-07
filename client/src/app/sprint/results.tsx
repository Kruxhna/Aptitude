import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SprintSubmissionResponse } from '../../api';
import { SkillBadge } from '../../components/SkillBadge';
import { SpriteAnimator } from '../../components/SpriteAnimator';
import { colors, duo } from '../../theme';

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
          style={styles.doneBtn}
          onPress={() => router.replace('/(tabs)' as any)}
        >
          <Text style={styles.doneBtnText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const accuracyPct = Math.round((resultsData.accuracy || 0) * 100);
  const isGreatScore = accuracyPct >= 80;
  const isOkScore = accuracyPct >= 50 && accuracyPct < 80;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Hero Card (Duolingo celebration) ── */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: isGreatScore
              ? colors.duoGreenLight
              : isOkScore
              ? '#FFF4CC'
              : colors.duoRedLight,
            borderColor: isGreatScore
              ? colors.duoGreen
              : isOkScore
              ? colors.duoGold
              : colors.duoRed,
            borderBottomColor: isGreatScore
              ? colors.duoGreenDark
              : isOkScore
              ? colors.duoGoldDark
              : colors.duoRedDark,
          },
        ]}
      >
        {/* Mascot */}
        <SpriteAnimator
          source={
            isGreatScore
              ? require('../../../assets/sprites/sprinty_correct_jump_sprite.png')
              : require('../../../assets/sprites/sprinty_idle_hover_sprite.png')
          }
          style={styles.heroMascot}
          frameCount={4}
          fps={isGreatScore ? 12 : 8}
          loop={!isGreatScore}
        />

        <Text
          style={[
            styles.heroTitle,
            {
              color: isGreatScore
                ? colors.duoGreenDark
                : isOkScore
                ? colors.duoGoldDark
                : colors.duoRedDark,
            },
          ]}
        >
          {isGreatScore
            ? 'Excellent!'
            : isOkScore
            ? 'Good effort!'
            : 'Keep practicing!'}
        </Text>

        <Text style={styles.accuracyBig}>{accuracyPct}%</Text>
        <Text style={styles.heroSub}>
          {resultsData.totalCorrect} of {resultsData.totalQuestions} Correct
        </Text>
      </View>

      {/* ── XP & Streak Row ── */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricEmoji}>⚡</Text>
          <Text style={styles.metricValue}>+{resultsData.xpEarned}</Text>
          <Text style={styles.metricLabel}>XP Earned</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricEmoji}>🔥</Text>
          <Text style={styles.metricValue}>
            {resultsData.streak?.currentStreak || 1}
          </Text>
          <Text style={styles.metricLabel}>Day Streak</Text>
        </View>
      </View>

      {/* ── Skill ELO Deltas ── */}
      <Text style={styles.sectionTitle}>SKILL ELO ADJUSTMENTS</Text>
      <View style={styles.deltasRow}>
        {Object.entries(resultsData.ratingDeltas || {}).map(
          ([skill, delta]: [string, any]) => {
            const numDelta = Number(delta) || 0;
            const isPositive = numDelta > 0;
            const isNegative = numDelta < 0;
            return (
              <View key={skill} style={styles.deltaCard}>
                <SkillBadge skill={skill as any} />
                <Text
                  style={[
                    styles.deltaValue,
                    isPositive && styles.deltaPositive,
                    isNegative && styles.deltaNegative,
                  ]}
                >
                  {isPositive ? `+${numDelta}` : numDelta === 0 ? '±0' : `${numDelta}`}
                </Text>
              </View>
            );
          }
        )}
      </View>

      {/* ── Answer Review ── */}
      <Text style={styles.sectionTitle}>ANSWER REVIEW</Text>
      {resultsData.results.map((item: any, idx: number) => (
        <View
          key={idx}
          style={[
            styles.reviewCard,
            {
              borderLeftWidth: 4,
              borderLeftColor: item.correct
                ? colors.duoGreen
                : colors.duoRed,
            },
          ]}
        >
          <View style={styles.reviewHeader}>
            <Text
              style={[
                styles.reviewStatus,
                { color: item.correct ? colors.duoGreenDark : colors.duoRedDark },
              ]}
            >
              {item.correct ? '✓ Correct' : '✗ Incorrect'} (
              {Math.round(item.timeMs / 1000)}s)
            </Text>
            <SkillBadge skill={item.skill || 'verbal'} />
          </View>

          <Text style={styles.reviewDetail}>
            <Text style={styles.labelBold}>Your answer: </Text>
            {String(item.userAnswer ?? 'No response')}
          </Text>

          {!item.correct && (
            <Text style={styles.reviewDetail}>
              <Text style={styles.labelBold}>Correct: </Text>
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

      {/* ── Done Button (Duolingo 3D) ── */}
      <TouchableOpacity
        style={styles.doneBtn}
        activeOpacity={0.85}
        onPress={() => router.replace('/(tabs)' as any)}
      >
        <Text style={styles.doneBtnText}>CONTINUE</Text>
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
    color: colors.duoRed,
    fontSize: 16,
    marginBottom: 16,
    fontWeight: '700',
  },

  // ── Hero Card ──
  heroCard: {
    borderRadius: duo.radiusCard,
    borderWidth: 2,
    borderBottomWidth: duo.depthButton,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroMascot: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  accuracyBig: {
    fontSize: 52,
    fontWeight: '700',
    color: colors.text,
    marginVertical: 4,
  },
  heroSub: {
    fontSize: duo.fontBody,
    fontWeight: '700',
    color: colors.textDark,
  },

  // ── Metrics Row ──
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: duo.radiusCard,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: duo.depthCard + 2,
    borderBottomColor: '#D5D5D5',
    paddingVertical: 16,
    alignItems: 'center',
  },
  metricEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  metricLabel: {
    fontSize: duo.fontSmall,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 2,
  },

  // ── Section ──
  sectionTitle: {
    fontSize: duo.fontCaption,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },

  // ── Deltas ──
  deltasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  deltaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: duo.radiusCard,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: duo.depthCard + 2,
    borderBottomColor: '#D5D5D5',
    padding: 12,
    width: '47%',
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
    color: colors.duoGreen,
  },
  deltaNegative: {
    color: colors.duoRed,
  },

  // ── Review Cards ──
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: duo.radiusCard,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: duo.depthCard + 2,
    borderBottomColor: '#D5D5D5',
    padding: 16,
    marginBottom: 12,
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
  reviewDetail: {
    color: colors.text,
    fontSize: 14,
    marginTop: 4,
  },
  labelBold: {
    fontWeight: '700',
    color: colors.textMuted,
  },
  explanationBox: {
    backgroundColor: colors.backgroundSoft,
    borderRadius: duo.radiusProgress,
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
    fontSize: duo.fontCaption,
    lineHeight: 18,
  },

  // ── Done Button (3D) ──
  doneBtn: {
    backgroundColor: colors.duoGreen,
    borderRadius: duo.radiusButton,
    borderBottomWidth: duo.depthButton,
    borderBottomColor: colors.duoGreenDark,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 1,
  },
});
