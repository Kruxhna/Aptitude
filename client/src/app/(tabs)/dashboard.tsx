import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { api, ProgressResponse, HistoryResponse } from '../../api';
import { ProgressRing } from '../../components/ProgressRing';
import { TrendChart } from '../../components/TrendChart';
import { SpriteAnimator } from '../../components/SpriteAnimator';
import { colors, duo } from '../../theme';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [mode, setMode] = useState<'rating' | 'accuracy'>('rating');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [progData, histData] = await Promise.all([
        api.getProgress(),
        api.getHistory(),
      ]);
      setProgress(progData);
      setHistory(histData);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const weeklyActivity = [
    { day: 'Mo', value: 1.2 },
    { day: 'Tu', value: 2.1 },
    { day: 'We', value: 1.8 },
    { day: 'Th', value: 2.7 },
    { day: 'Fr', value: 1.4 },
    { day: 'Sa', value: 2.9 },
    { day: 'Su', value: 1.9 },
  ];

  const skillsList = ['verbal', 'quantitative', 'logical', 'spatial'] as const;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Profile Header ── */}
      <View style={styles.profileRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>S</Text>
        </View>
        <View>
          <Text style={styles.profileName}>Siddharth</Text>
          <Text style={styles.profileJoined}>Joined 38 days ago</Text>
        </View>
      </View>

      {/* ── Stat Cards Row (3D depth) ── */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total XP', value: '12k', emoji: '⚡' },
          { label: 'Days Active', value: '38', emoji: '📅' },
          { label: 'Streak', value: '42 🔥', emoji: '' },
        ].map((stat, idx) => (
          <View key={idx} style={styles.statCard}>
            {stat.emoji ? (
              <Text style={styles.statEmoji}>{stat.emoji}</Text>
            ) : null}
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Weekly Activity (3D card) ── */}
      <View style={styles.card3d}>
        <Text style={styles.cardTitle}>WEEKLY ACTIVITY</Text>
        <View style={styles.chartRow}>
          {weeklyActivity.map((bar, index) => (
            <View key={index} style={styles.barCol}>
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${(bar.value / 3.0) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.barDay}>{bar.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Topics to Strengthen ── */}
      <Text style={styles.sectionTitle}>TOPICS TO STRENGTHEN</Text>

      <View style={styles.strengthenRow}>
        <View style={styles.focusCol}>
          {['CACHING', 'THREADS'].map((topic) => (
            <View key={topic} style={styles.focusCard}>
              <View style={styles.focusHeader}>
                <Text style={styles.focusLabel}>NEEDS FOCUS</Text>
                <Text>⚠️</Text>
              </View>
              <Text style={styles.focusTopic}>{topic}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.reviewCta} activeOpacity={0.85}>
          <Text style={styles.reviewCtaIcon}>⏱</Text>
          <Text style={styles.reviewCtaText}>START{'\n'}REVIEW</Text>
          <View style={styles.reviewMascotWrap}>
            <SpriteAnimator
              source={require('../../../assets/sprites/sprinty_idle_hover_sprite.png')}
              style={styles.reviewMascotImg}
              frameCount={4}
              fps={8}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Per-Skill Mastery Rings ── */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
        PER-SKILL MASTERY
      </Text>
      <View style={styles.ringsGrid}>
        {skillsList.map((skill) => {
          const item = progress?.skills?.[skill] || { elo: 1000, score: 33 };
          return (
            <ProgressRing
              key={skill}
              skill={skill}
              score={item.score ?? 33}
            />
          );
        })}
      </View>

      {/* ── 30-Day Trends ── */}
      <View style={styles.card3d}>
        <View style={styles.trendHeader}>
          <Text style={styles.cardTitle}>30-DAY SKILL TRENDS</Text>
          <View style={styles.modeToggle}>
            {(['rating', 'accuracy'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
                onPress={() => setMode(m)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    mode === m && styles.toggleTextActive,
                  ]}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TrendChart data={history?.history || {}} metric={mode} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },

  // ── Profile ──
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.duoGold,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: colors.duoGoldDark,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  profileJoined: {
    fontSize: duo.fontCaption,
    fontWeight: '500',
    color: colors.textMuted,
  },

  // ── Stat Cards (3D) ──
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: duo.radiusCard,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: duo.depthCard + 2,
    borderBottomColor: '#D5D5D5',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: duo.fontSmall,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 2,
  },

  // ── 3D Card ──
  card3d: {
    backgroundColor: '#FFFFFF',
    borderRadius: duo.radiusCard,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: duo.depthCard + 2,
    borderBottomColor: '#D5D5D5',
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: duo.fontCaption,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 16,
  },

  // ── Weekly Activity ──
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barBg: {
    width: 14,
    height: 70,
    backgroundColor: '#F7F7F7',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 7,
  },
  barDay: {
    fontSize: duo.fontSmall,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 6,
  },

  // ── Topics to Strengthen ──
  sectionTitle: {
    fontSize: duo.fontCaption,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  strengthenRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  focusCol: {
    flex: 1,
    gap: 10,
  },
  focusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: duo.radiusCard,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: duo.depthCard + 2,
    borderBottomColor: '#D5D5D5',
    padding: 14,
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  focusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.duoRed,
    letterSpacing: 0.5,
  },
  focusTopic: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  reviewCta: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: duo.radiusCard,
    borderBottomWidth: duo.depthCard + 2,
    borderBottomColor: colors.primaryDark,
    padding: 18,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  reviewCtaIcon: {
    fontSize: 28,
  },
  reviewCtaText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 8,
  },
  reviewMascotWrap: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 70,
    height: 70,
  },
  reviewMascotImg: {
    width: 70,
    height: 70,
  },

  // ── Skills Rings ──
  ringsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  // ── Trends ──
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F7F7F7',
    borderRadius: duo.radiusProgress,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
});
