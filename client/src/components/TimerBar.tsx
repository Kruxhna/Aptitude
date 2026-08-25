import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';
import { colors, duo } from '../theme';
import { useFeedback } from '../services/FeedbackProvider';

interface TimerBarProps {
  durationMs?: number;
  durationSeconds?: number;
  onTimeUp?: () => void;
  onTimeOut?: () => void;
  isPaused?: boolean;
  isActive?: boolean;
  /** If true, play a tick sound each second in the final 5s. Default: true. */
  tickAudioEnabled?: boolean;
}

export function TimerBar({
  durationMs,
  durationSeconds,
  onTimeUp,
  onTimeOut,
  isPaused = false,
  isActive = true,
  tickAudioEnabled = true,
}: TimerBarProps) {
  const progress = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);
  const { feedback } = useFeedback();

  const totalMs = durationMs || (durationSeconds ? durationSeconds * 1000 : 30000);
  const timeUpCallback = onTimeUp || onTimeOut;

  // Track haptic warning — only fire once per question
  const warnFiredRef = useRef(false);
  // Track tick intervals for final 5 seconds
  const tickIntervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => {
    progress.value = 1;
    pulseOpacity.value = 1;
    warnFiredRef.current = false;

    // Clear any leftover tick intervals from previous render
    tickIntervalsRef.current.forEach(clearInterval);
    tickIntervalsRef.current = [];

    const shouldAnimate = !isPaused && isActive;

    if (shouldAnimate && timeUpCallback) {
      // Animate the Reanimated bar
      progress.value = withTiming(0, {
        duration: totalMs,
        easing: Easing.linear,
      }, (finished) => {
        if (finished) {
          runOnJS(timeUpCallback)();
        }
      });

      // Low-time pulsating glow (< 20% remaining time)
      const pulseDelay = Math.max(0, totalMs * 0.8);
      const pulseTimer = setTimeout(() => {
        pulseOpacity.value = withRepeat(
          withSequence(
            withTiming(0.4, { duration: 250 }),
            withTiming(1, { duration: 250 })
          ),
          -1,
          true
        );
      }, pulseDelay);

      // Warning haptic + audio at 5s remaining
      const warningThresholdMs = 5000;
      const warningDelay = Math.max(0, totalMs - warningThresholdMs);

      const warningTimer = setTimeout(() => {
        if (!warnFiredRef.current) {
          warnFiredRef.current = true;
          feedback.haptics.warningNotification();

          // Tick audio for each of the final 5 seconds
          if (tickAudioEnabled) {
            let ticks = 5;
            const interval = setInterval(() => {
              feedback.audio.timerTick();
              ticks -= 1;
              if (ticks <= 0) clearInterval(interval);
            }, 1000);
            tickIntervalsRef.current.push(interval);
          }
        }
      }, warningDelay);

      return () => {
        clearTimeout(pulseTimer);
        clearTimeout(warningTimer);
        tickIntervalsRef.current.forEach(clearInterval);
        tickIntervalsRef.current = [];
      };
    }
  }, [totalMs, isPaused, isActive]);

  const animatedStyle = useAnimatedStyle(() => {
    // 100% – 50%: Neon Green (#22C55E)
    // 49% – 20%: Amber Yellow (#F59E0B)
    // < 20%: Crimson Red (#EF4444)
    const bgColor = interpolateColor(
      progress.value,
      [0, 0.2, 0.5, 1],
      ['#EF4444', '#EF4444', '#F59E0B', '#22C55E']
    );

    return {
      width: `${progress.value * 100}%`,
      backgroundColor: bgColor,
      opacity: progress.value < 0.2 ? pulseOpacity.value : 1,
    };
  });

  return (
    <View
      style={styles.track}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel="Time remaining"
    >
      <Animated.View style={[styles.fill, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
    marginVertical: 8,
  },
  fill: {
    height: '100%',
    borderRadius: 8,
  },
});
