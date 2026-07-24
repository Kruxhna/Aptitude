import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { skillGradients, skillNames, colors } from '../theme';

interface ProgressRingProps {
  skill: string;
  score: number; // 0–100
  elo: number;
  size?: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  skill,
  score,
  elo,
  size = 110,
}) => {
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, score))) / 100;

  const gradientColors = skillGradients[skill.toLowerCase()] || ['#6366F1', '#4F46E5'];
  const gradientId = `grad_${skill}`;

  return (
    <View style={[styles.card, { width: '48%' }]}>
      <View style={styles.ringWrapper}>
        <Svg width={size} height={size}>
          <Defs>
            <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradientColors[0]} />
              <Stop offset="100%" stopColor={gradientColors[1]} />
            </SvgLinearGradient>
          </Defs>
          {/* Background Track Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.cardBorder}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Foreground Animated Score Stroke */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.centerTextContainer}>
          <Text style={styles.scoreText}>{score}</Text>
          <Text style={styles.scoreLabel}>/ 100</Text>
        </View>
      </View>
      <Text style={styles.skillTitle}>
        {skillNames[skill.toLowerCase()] || skill.toUpperCase()}
      </Text>
      <Text style={styles.eloText}>{elo} ELO</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  ringWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: -2,
  },
  skillTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  eloText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
