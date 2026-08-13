import React, { useEffect, useRef } from 'react';
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
import { useFeedback } from '../services/FeedbackProvider';

interface TimerBarProps {
  durationMs?: number;
  durationSeconds?: number;
  onTimeUp?: () => void;
  onTimeOut?: () => void;
  isPaused?: boolean;
  isActive?: boolean;
  /** If true, play a tick sound each second in the final 5s. Default: false. */
  tickAudioEnabled?: boolean;
}

export function TimerBar({
  durationMs,
  durationSeconds,
  onTimeUp,
  onTimeOut,
  isPaused = false,
  isActive = true,
  tickAudioEnabled = false,
}: TimerBarProps) {
  const progress = useSharedValue(1);
  const { feedback } = useFeedback();

  const totalMs = durationMs || (durationSeconds ? durationSeconds * 1000 : 30000);
  const timeUpCallback = onTimeUp || onTimeOut;

  // Track haptic warning — only fire once per question
  const warnFiredRef = useRef(false);
  // Track tick intervals for final 5 seconds
  const tickIntervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => {
    progress.value = 1;
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

      // JS-side tracking for haptic/audio events (Reanimated runs on UI thread)
      const warningThresholdMs = 5000;
      const warningDelay = Math.max(0, totalMs - warningThresholdMs);

      // Warning haptic + audio at 5s remaining
      const warningTimer = setTimeout(() => {
        if (!warnFiredRef.current) {
          warnFiredRef.current = true;
          feedback.haptics.warningNotification();

          // Tick audio for each of the final 5 seconds (optional)
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
        clearTimeout(warningTimer);
        tickIntervalsRef.current.forEach(clearInterval);
        tickIntervalsRef.current = [];
      };
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
