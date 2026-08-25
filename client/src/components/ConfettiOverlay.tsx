import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableWithoutFeedback } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#22C55E', // Green
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#FBBF24', // Yellow
];

interface ParticleProps {
  index: number;
  startX: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
}

function ConfettiPiece({ startX, color, size, duration, delay }: ParticleProps) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  const horizontalDrift = (Math.random() - 0.5) * 120;
  const targetRotation = (Math.random() - 0.5) * 1080;

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 50, { duration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    );
    translateX.value = withDelay(
      delay,
      withTiming(startX + horizontalDrift, { duration, easing: Easing.out(Easing.quad) })
    );
    rotation.value = withDelay(
      delay,
      withTiming(targetRotation, { duration, easing: Easing.linear })
    );
    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 })
    );
  }, []);

  const particleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          width: size,
          height: size * (Math.random() > 0.5 ? 1.6 : 1),
          borderRadius: size > 10 ? 2 : 1,
        },
        particleStyle,
      ]}
    />
  );
}

interface ConfettiOverlayProps {
  visible: boolean;
  streakCount: number;
  onDismiss?: () => void;
}

export function ConfettiOverlay({ visible, streakCount, onDismiss }: ConfettiOverlayProps) {
  const bannerScale = useSharedValue(0.5);
  const bannerOpacity = useSharedValue(0);

  const particles = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      startX: Math.random() * (SCREEN_WIDTH - 20) + 10,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: Math.random() * 8 + 6,
      duration: Math.random() * 1200 + 1600,
      delay: Math.random() * 300,
    }));
  }, [visible]);

  useEffect(() => {
    if (visible) {
      bannerScale.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.back(1.5)) });
      bannerOpacity.value = withTiming(1, { duration: 250 });

      const autoDismiss = setTimeout(() => {
        bannerOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished && onDismiss) {
            runOnJS(onDismiss)();
          }
        });
      }, 2500);

      return () => clearTimeout(autoDismiss);
    } else {
      bannerScale.value = 0.5;
      bannerOpacity.value = 0;
    }
  }, [visible]);

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bannerScale.value }],
    opacity: bannerOpacity.value,
  }));

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={onDismiss}>
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Confetti Particles */}
        {particles.map((p) => (
          <ConfettiPiece
            key={p.id}
            index={p.id}
            startX={p.startX}
            color={p.color}
            size={p.size}
            duration={p.duration}
            delay={p.delay}
          />
        ))}

        {/* Milestone Celebration Banner */}
        <Animated.View style={[styles.bannerContainer, bannerStyle]}>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerEmoji}>⚡🔥⚡</Text>
            <Text style={styles.bannerTitle}>STREAK ON FIRE!</Text>
            <Text style={styles.bannerSubtitle}>{streakCount} IN A ROW</Text>
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 50,
  },
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  bannerBadge: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#38BDF8',
    paddingVertical: 18,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 25,
  },
  bannerEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  bannerTitle: {
    color: '#38BDF8',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  bannerSubtitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 1,
  },
});
