import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { theme } from '../theme';

interface TimerBarProps {
  durationMs: number;
  onTimeUp: () => void;
  isPaused?: boolean;
}

export function TimerBar({ durationMs, onTimeUp, isPaused = false }: TimerBarProps) {
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = 1; // Reset progress
    
    if (!isPaused) {
      progress.value = withTiming(0, {
        duration: durationMs,
        easing: Easing.linear,
      }, (finished) => {
        if (finished) {
          runOnJS(onTimeUp)();
        }
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMs, isPaused]);

  const animatedStyle = useAnimatedStyle(() => {
    const isCritical = progress.value < 0.25;
    return {
      width: `${progress.value * 100}%`,
      backgroundColor: isCritical ? theme.colors.error : theme.colors.primary,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bar, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
    marginVertical: 16,
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
});
