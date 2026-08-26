import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';
import { colors, duo } from '../theme';

interface TimerBarProps {
  durationMs?: number;
  durationSeconds?: number;
  onTimeUp?: () => void;
  onTimeOut?: () => void;
  onCriticalThreshold?: () => void;
  isPaused?: boolean;
  isActive?: boolean;
}

export function TimerBar({ 
  durationMs, 
  durationSeconds,
  onTimeUp, 
  onTimeOut,
  onCriticalThreshold,
  isPaused = false,
  isActive = true,
}: TimerBarProps) {
  const progress = useSharedValue(1);

  const totalMs = durationMs || (durationSeconds ? durationSeconds * 1000 : 30000);
  const timeUpCallback = onTimeUp || onTimeOut;

  useEffect(() => {
    progress.value = 1;
    
    const shouldAnimate = !isPaused && isActive;
    
    if (shouldAnimate && timeUpCallback) {
      progress.value = withTiming(0, {
        duration: totalMs,
        easing: Easing.linear,
      }, (finished) => {
        if (finished) {
          runOnJS(timeUpCallback)();
        }
      });
    }
  }, [totalMs, isPaused, isActive]);

  const animatedStyle = useAnimatedStyle(() => {
    // Duolingo-style: Gold → Orange → Red as time runs out
    const bgColor = interpolateColor(
      progress.value,
      [0, 0.25, 0.5, 1],
      [colors.duoRed, colors.duoRed, '#FF9600', colors.duoGold]
    );

    return {
      width: `${progress.value * 100}%`,
      backgroundColor: bgColor,
    };
  });

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 16,
    backgroundColor: colors.cardBorder,
    borderRadius: duo.radiusProgress,
    overflow: 'hidden',
    width: '100%',
    marginVertical: 12,
  },
  fill: {
    height: '100%',
    borderRadius: duo.radiusProgress,
  },
});
