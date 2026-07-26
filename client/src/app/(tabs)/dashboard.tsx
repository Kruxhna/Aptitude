import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { api, ProgressResponse, HistoryResponse } from '../../api';
import { ProgressRing } from '../../components/ProgressRing';
import { TrendChart } from '../../components/TrendChart';

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

  const weeklyActivityData = [
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
      {/* Profile Header Row */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <SymbolView name="person.crop.circle.fill" size={54} tintColor="#F59E0B" />
        </View>
        <Text style={styles.profileName}>Siddharth</Text>
      </View>

      {/* Overview Metrics Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total XP</Text>
          <Text style={styles.statValue}>12k</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Days Active</Text>
          <Text style={styles.statValue}>38</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Streak</Text>
          <Text style={styles.statValue}>42 Days 🔥</Text>
        </View>
      </View>

      {/* Weekly Activity Bar Chart */}
      <View style={styles.cardContainer}>
        <Text style={styles.cardTitleHeader}>WEEKLY ACTIVITY</Text>
        
        <View style={styles.chartWrapper}>
          {weeklyActivityData.map((bar, index) => (
            <View key={index} style={styles.barItem}>
              <View style={styles.barBackground}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${(bar.value / 3.0) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.barDayText}>{bar.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Topics to Strengthen & Review Action CTA */}
      <Text style={styles.sectionLabel}>TOPICS TO STRENGTHEN</Text>

      <View style={styles.strengthenRow}>
        {/* Needs Focus Column */}
        <View style={styles.focusColumn}>
          <View style={styles.topicCard}>
            <View style={styles.topicHeader}>
              <Text style={styles.topicLabel}>NEEDS FOCUS:</Text>
              <Text style={styles.warningIcon}>⚠️</Text>
            </View>
            <Text style={styles.topicTitle}>CACHING</Text>
          </View>

          <View style={styles.topicCard}>
            <View style={styles.topicHeader}>
              <Text style={styles.topicLabel}>NEEDS FOCUS:</Text>
              <Text style={styles.warningIcon}>⚠️</Text>
            </View>
            <Text style={styles.topicTitle}>THREADS</Text>
          </View>
        </View>

        {/* Start Review Cyan CTA Card */}
        <TouchableOpacity style={styles.startReviewCard} activeOpacity={0.85}>
          <SymbolView name="stopwatch.fill" size={32} tintColor="#FFFFFF" />
          <Text style={styles.startReviewText}>START{"\n"}REVIEW</Text>
          
          <View style={styles.reviewMascotWrapper}>
            <Image
              source={require('../../../assets/sprites/sprinty_idle_hover_sprite.png')}
              style={styles.reviewMascotImage}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Per-Skill Progress Rings Section */}
      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>PER-SKILL MASTERY</Text>
      <View style={styles.ringsGrid}>
        {skillsList.map(skill => {
          const item = progress?.skills?.[skill] || { elo: 1000, score: 33 };
          return (
            <ProgressRing
              key={skill}
              skill={skill}
              score={item.score}
              elo={item.elo}
            />
          );
        })}
      </View>

      {/* 30-Day Skill Trends */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Text style={styles.cardTitleHeader}>30-DAY SKILL TRENDS</Text>
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                mode === 'rating' && styles.toggleBtnActive,
              ]}
              onPress={() => setMode('rating')}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === 'rating' && styles.toggleTextActive,
                ]}
              >
                Rating
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                mode === 'accuracy' && styles.toggleBtnActive,
              ]}
              onPress={() => setMode('accuracy')}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === 'accuracy' && styles.toggleTextActive,
                ]}
              >
                Accuracy
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TrendChart historyData={history?.history || {}} mode={mode} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDF2F7',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTitleHeader: {
    fontSize: 13,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 16,
  },
  chartWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingTop: 10,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    width: 14,
    height: 70,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#00C4B4',
    borderRadius: 7,
  },
  barDayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 12,
  },
  strengthenRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  focusColumn: {
    flex: 1,
    gap: 10,
  },
  topicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  topicLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  warningIcon: {
    fontSize: 12,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  startReviewCard: {
    flex: 1,
    backgroundColor: '#00C4B4',
    borderRadius: 20,
    padding: 18,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  startReviewText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
    marginTop: 12,
  },
  reviewMascotWrapper: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 70,
    height: 70,
  },
  reviewMascotImage: {
    width: 70,
    height: 70,
  },
  ringsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  historySection: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#00C4B4',
  },
  toggleText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
