import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api, UserMeResponse, ProgressResponse } from '../../src/api';
import { SkillBadge } from '../../src/components/SkillBadge';
import { colors } from '../../src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserMeResponse | null>(null);
  const [progressData, setProgressData] = useState<ProgressResponse | null>(null);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [user, prog] = await Promise.all([
        api.getUserMe(),
        api.getProgress(),
      ]);
      setUserData(user);
      setProgressData(prog);
    } catch (err) {
      console.error('Failed to fetch home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const skillsList = ['verbal', 'quantitative', 'logical', 'spatial'] as const;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.usernameText}>GATE Aspirant</Text>
        </View>

        <View style={styles.statsBadges}>
          <View style={styles.badgeItem}>
            <Text style={styles.badgeIcon}>🔥</Text>
            <Text style={styles.badgeValue}>{userData?.currentStreak || 1}</Text>
          </View>

          <View style={[styles.badgeItem, styles.xpBadge]}>
            <Text style={styles.badgeIcon}>⚡</Text>
            <Text style={styles.badgeValue}>{userData?.totalXp || 0}</Text>
          </View>
        </View>
      </View>

      {/* Main Daily Sprint Hero CTA */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>TODAY'S GOAL</Text>
        <Text style={styles.heroTitle}>Daily Adaptive Sprint</Text>
        <Text style={styles.heroSubtitle}>
          10 difficulty-matched questions tailored to your current ELO
        </Text>

        <TouchableOpacity
          style={styles.heroButton}
          activeOpacity={0.85}
          onPress={() => router.push('/sprint/standard')}
        >
          <Text style={styles.heroButtonText}>Start Sprint →</Text>
        </TouchableOpacity>
      </View>

      {/* Skill Summary Cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Skill Mastery Overview</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/dashboard')}>
          <Text style={styles.seeAllText}>View Dashboard</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.skillsGrid}>
        {skillsList.map(skill => {
          const prog = progressData?.skills?.[skill] || { elo: 1000, score: 33 };
          return (
            <TouchableOpacity
              key={skill}
              style={styles.skillCard}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/sprint')}
            >
              <View style={styles.skillCardHeader}>
                <SkillBadge skill={skill} size="small" />
                <Text style={styles.scoreNumber}>{prog.score}/100</Text>
              </View>

              <Text style={styles.eloSubtitle}>{prog.elo} ELO Rating</Text>
            </TouchableOpacity>
          );
        })}
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
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  usernameText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  statsBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  xpBadge: {
    borderColor: colors.warning,
  },
  badgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  badgeValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  heroCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 22,
    marginBottom: 24,
  },
  heroLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },
  heroButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  skillsGrid: {
    gap: 12,
  },
  skillCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
  },
  skillCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreNumber: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  eloSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
});
