import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';

interface StreakFlameProps {
  streak: number;
}

export function StreakFlame({ streak }: StreakFlameProps) {
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (streak > 0) {
      // Punch / bounce animation on streak increment
      scale.value = withSequence(
        withTiming(1.4, { duration: 150, easing: Easing.out(Easing.cubic) }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );

      // Pulse animation for high streaks (3+)
      if (streak >= 3) {
        pulse.value = withRepeat(
          withSequence(
            withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
            withTiming(1.0, { duration: 600, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
      } else {
        pulse.value = 1;
      }

      // Glow animation for super streaks (5+)
      if (streak >= 5) {
        glow.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 800 }),
            withTiming(0.4, { duration: 800 })
          ),
          -1,
          true
        );
      } else {
        glow.value = 0;
      }
    } else {
      scale.value = 1;
      pulse.value = 1;
      glow.value = 0;
    }
  }, [streak]);

  const animatedFlameStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value * pulse.value }],
    };
  });

  if (streak <= 0) return null;

  // Determine Tier colors and flame icons
  let flameIcon = '🔥';
  let badgeBg = '#FFF4CC';
  let badgeBorder = '#FFE082';
  let textColor = '#D97706';
  let tierLabel = '';

  if (streak >= 5) {
    flameIcon = '⚡🔥';
    badgeBg = '#E0F2FE';
    badgeBorder = '#38BDF8';
    textColor = '#0284C7';
    tierLabel = 'SUPER';
  } else if (streak >= 3) {
    flameIcon = '🔥';
    badgeBg = '#FFEDD5';
    badgeBorder = '#FB923C';
    textColor = '#EA580C';
    tierLabel = 'HOT';
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: badgeBg, borderColor: badgeBorder },
        animatedFlameStyle,
      ]}
    >
      <Text style={styles.flameIcon}>{flameIcon}</Text>
      <Text style={[styles.streakText, { color: textColor }]}>
        {streak} {tierLabel ? `(${tierLabel})` : ''}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  flameIcon: {
    fontSize: 16,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
