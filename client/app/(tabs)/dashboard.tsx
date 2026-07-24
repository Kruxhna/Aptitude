import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { api } from '../../src/api';
import { theme } from '../../src/theme';
import { ProgressRing } from '../../src/components/ProgressRing';
import { TrendChart } from '../../src/components/TrendChart';
import { SkillBadge } from '../../src/components/SkillBadge';

export default function DashboardScreen() {
  const [progressData, setProgressData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<'rating' | 'accuracy'>('rating');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progress, history] = await Promise.all([
          api.getProgress(),
          api.getHistory()
        ]);
        setProgressData(progress);
        setHistoryData(history);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderRings = () => {
    if (!progressData || !progressData.skills) return null;
    const skills = ['verbal', 'quantitative', 'logical', 'spatial'] as const;

    return (
      <View style={styles.ringsGrid}>
        {skills.map(skill => (
          <View key={skill} style={styles.ringCell}>
            <ProgressRing
              score={progressData.skills[skill]?.normalizedScore || 0}
              skill={skill}
              size={100}
              strokeWidth={10}
            />
            <View style={{ marginTop: 12 }}>
              <SkillBadge skill={skill} />
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Your Progress</Text>
      
      {renderRings()}

      <View style={styles.trendHeader}>
        <Text style={styles.sectionTitle}>30-Day Trend</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, metric === 'rating' && styles.toggleActive]}
            onPress={() => setMetric('rating')}
          >
            <Text style={[styles.toggleText, metric === 'rating' && styles.toggleTextActive]}>ELO</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, metric === 'accuracy' && styles.toggleActive]}
            onPress={() => setMetric('accuracy')}
          >
            <Text style={[styles.toggleText, metric === 'accuracy' && styles.toggleTextActive]}>Accuracy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TrendChart data={historyData?.history} metric={metric} />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 60,
  },
  centered: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  ringsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 32,
  },
  ringCell: {
    width: '47%',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: theme.colors.border,
  },
  toggleText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: theme.colors.text,
  },
});
