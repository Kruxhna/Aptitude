import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { HistoryPoint } from '../api';
import { colors, skillGradients } from '../theme';

interface TrendChartProps {
  historyData: Record<string, HistoryPoint[]>;
  mode: 'rating' | 'accuracy';
}

export const TrendChart: React.FC<TrendChartProps> = ({ historyData, mode }) => {
  const activeSkill = 'verbal'; // Default primary series
  const points = historyData[activeSkill] || [];

  if (points.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No historical session data recorded yet.</Text>
        <Text style={styles.emptySubtext}>Complete daily sprints to generate 30-day trend lines.</Text>
      </View>
    );
  }

  const chartData = points.map(pt => ({
    value: mode === 'rating' ? pt.rating : Math.round(pt.accuracy * 100),
    label: pt.date.slice(5), // 'MM-DD'
  }));

  const primaryColor = skillGradients[activeSkill][0] || colors.accent;

  return (
    <View style={styles.chartContainer}>
      <LineChart
        data={chartData}
        height={180}
        color={primaryColor}
        thickness={3}
        startFillColor={primaryColor}
        endFillColor={`${primaryColor}10`}
        startOpacity={0.4}
        endOpacity={0.0}
        initialSpacing={10}
        noOfSections={4}
        yAxisColor="transparent"
        xAxisColor={colors.cardBorder}
        yAxisTextStyle={styles.axisText}
        xAxisLabelTextStyle={styles.axisText}
        rulesColor={colors.cardBorder}
        rulesType="solid"
        curved
      />
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 24,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    marginVertical: 10,
  },
  emptyText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  axisText: {
    color: colors.textMuted,
    fontSize: 10,
  },
});
