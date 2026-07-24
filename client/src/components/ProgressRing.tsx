import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { theme } from '../theme';

interface ProgressRingProps {
  score: number; // 0 to 100
  skill: 'verbal' | 'quantitative' | 'logical' | 'spatial';
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({ score, skill, size = 120, strokeWidth = 12 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const gradient = theme.skillGradients[skill] || theme.skillGradients.verbal;
  const gradientId = `gradient-${skill}`;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={gradient[0]} />
            <Stop offset="1" stopColor={gradient[1]} />
          </SvgLinearGradient>
        </Defs>
        {/* Background Track */}
        <Circle
          stroke={theme.colors.border}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress Stroke */}
        <Circle
          stroke={`url(#${gradientId})`}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          originX={size / 2}
          originY={size / 2}
          rotation="-90"
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={styles.scoreText}>{score}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
});
