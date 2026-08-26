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
import { useFeedback } from '../services/FeedbackProvider';
import { useAccessibility } from '../services/AccessibilityProvider';
import { useTheme } from '../hooks/use-theme';

interface TimerBarProps {
  durationMs?: number;
  durationSeconds?: number;
  onTimeUp?: () => void;
  onTimeOut?: () => void;
  onCriticalThreshold?: () => void;
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
  onCriticalThreshold,
  isPaused = false,
  isActive = true,
  tickAudioEnabled = true,
}: TimerBarProps) {
  const progress = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);
  const { feedback } = useFeedback();
  const theme = useTheme();

  let isReducedMotion = false;
  try {
    const acc = useAccessibility();
    isReducedMotion = acc.isReducedMotionActive;
  } catch {
    // Outside accessibility provider
  }

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
        if (onCriticalThreshold) {
          onCriticalThreshold();
        }
        if (!isReducedMotion) {
          pulseOpacity.value = withRepeat(
            withSequence(
              withTiming(0.4, { duration: 250 }),
              withTiming(1, { duration: 250 })
            ),
            -1,
            true
          );
        }
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
  }, [totalMs, isPaused, isActive, isReducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      progress.value,
      [0, 0.2, 0.5, 1],
      [theme.duoRed, theme.duoRed, theme.duoGold, theme.duoGreen]
    );

    return {
      width: `${progress.value * 100}%`,
      backgroundColor: bgColor,
      opacity: progress.value < 0.2 && !isReducedMotion ? pulseOpacity.value : 1,
    };
  });

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.cardBorder,
        },
      ]}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel="Time remaining in sprint"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress.value * 100) }}
    >
      <Animated.View style={[styles.fill, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
    marginVertical: 8,
  },
  fill: {
    height: '100%',
    borderRadius: 8,
  },
});
