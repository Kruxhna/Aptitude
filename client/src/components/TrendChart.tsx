import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { theme } from '../theme';

interface TrendChartProps {
  data: any; // The structure matching GET /api/analytics/history
  metric: 'rating' | 'accuracy';
}

export function TrendChart({ data, metric }: TrendChartProps) {
  // Format data for react-native-gifted-charts LineChart
  // LineChart expects an array of datasets: [{data: [{value: x, label: y}, ...], color: 'c'}, ...]
  
  if (!data || Object.keys(data).length === 0) {
    return <View style={styles.emptyContainer} />;
  }

  const skills = ['verbal', 'quantitative', 'logical', 'spatial'] as const;
  
  // Find all unique dates across all skills for the x-axis
  const allDates = new Set<string>();
  skills.forEach(skill => {
    if (data[skill]) {
      data[skill].forEach((point: any) => allDates.add(point.date));
    }
  });
  const sortedDates = Array.from(allDates).sort();

  const lineData = skills.map(skill => {
    const skillData = data[skill] || [];
    const color = theme.skillGradients[skill]?.[1] || theme.colors.primary;
    
    // Map data points for this skill, ensuring points align with dates
    const points = sortedDates.map(date => {
      const match = skillData.find((d: any) => d.date === date);
      // Determine value based on metric
      let val = 0;
      if (match) {
        val = metric === 'rating' ? match.rating : Math.round((match.correctCount / Math.max(match.totalQuestions, 1)) * 100);
      }
      return {
        value: val,
        label: date.substring(5), // e.g. "07-24" instead of "2026-07-24"
        dataPointText: match ? val.toString() : '',
      };
    }).filter(p => p.value !== 0); // Filter out zero values if they just represent no data

    return {
      data: points.length > 0 ? points : [{value: 0}],
      color,
      thickness: 3,
      dataPointsColor: color,
    };
  });

  return (
    <View style={styles.container}>
      <LineChart
        data={lineData[0].data}
        data2={lineData[1].data}
        data3={lineData[2].data}
        data4={lineData[3].data}
        color1={lineData[0].color}
        color2={lineData[1].color}
        color3={lineData[2].color}
        color4={lineData[3].color}
        dataPointsColor1={lineData[0].color}
        dataPointsColor2={lineData[1].color}
        dataPointsColor3={lineData[2].color}
        dataPointsColor4={lineData[3].color}
        hideDataPoints={false}
        dataPointsRadius={4}
        width={300}
        height={220}
        yAxisColor={theme.colors.border}
        xAxisColor={theme.colors.border}
        yAxisTextStyle={{ color: theme.colors.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: theme.colors.textMuted, fontSize: 10 }}
        rulesColor={theme.colors.border}
        rulesType="solid"
        yAxisLabelTexts={metric === 'accuracy' ? ['0', '25', '50', '75', '100'] : undefined}
        stepValue={metric === 'accuracy' ? 25 : undefined}
        maxValue={metric === 'accuracy' ? 100 : undefined}
        spacing={40}
        initialSpacing={20}
        textColor={theme.colors.text}
        backgroundColor={theme.colors.card}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginVertical: 16,
    width: '100%',
    overflow: 'hidden',
  },
  emptyContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
