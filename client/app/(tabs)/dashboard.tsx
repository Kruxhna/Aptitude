import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { api, ProgressResponse, HistoryResponse } from '../../src/api';
import { ProgressRing } from '../../src/components/ProgressRing';
import { TrendChart } from '../../src/components/TrendChart';
import { colors } from '../../src/theme';

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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading performance analytics...</Text>
      </View>
    );
  }

  const skillsList = ['verbal', 'quantitative', 'logical', 'spatial'] as const;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Per-Skill Progress</Text>
      <Text style={styles.sectionSubtitle}>Normalized ELO mastery (0–100 scale)</Text>

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

      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>30-Day Skill Trends</Text>
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
  loadingText: {
    color: colors.textMuted,
    marginTop: 12,
    fontSize: 15,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
  },
  ringsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  historySection: {
    marginTop: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: colors.accent,
  },
  toggleText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
