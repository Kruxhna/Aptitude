import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS, RADII, SPRING } from '../theme';

interface StrategyTipProps {
  tip: string;
  duration?: number;       // seconds before auto-dismiss (default 3)
  animation?: 'slideUp' | 'fadeIn' | 'springIn';
  onDismiss: () => void;
}

/**
 * StrategyTip
 * Animated tip card shown before a question in Learn mode.
 * Springs into view from below, auto-dismisses after `duration` seconds.
 */
export default function StrategyTip({
  tip,
  duration = 3,
  animation = 'springIn',
  onDismiss,
}: StrategyTipProps) {
  const translateY = useSharedValue(120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    if (animation === 'springIn') {
      translateY.value = withSpring(0, SPRING.bounce);
      opacity.value = withTiming(1, { duration: 200 });
    } else if (animation === 'slideUp') {
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      // fadeIn — no translation
      translateY.value = 0;
      opacity.value = withTiming(1, { duration: 400 });
    }

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      translateY.value = withTiming(-40, { duration: 250 });
      opacity.value = withTiming(0, { duration: 250 }, (finished) => {
        if (finished) runOnJS(onDismiss)();
      });
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animStyle]}>
      {/* Lightbulb icon */}
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>💡</Text>
      </View>

      {/* Tip content */}
      <View style={styles.textWrap}>
        <Text style={styles.label}>Strategy Tip</Text>
        <Text style={styles.tip}>{tip}</Text>
      </View>

      {/* Manual dismiss */}
      <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn} accessibilityLabel="Dismiss tip">
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    borderRadius: RADII.card,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    // GPU-accelerated shadow — no layout properties
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  iconWrap: {
    marginRight: 12,
    marginTop: 2,
  },
  icon: {
    fontSize: 24,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF9800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  tip: {
    fontSize: 14,
    lineHeight: 20,
    color: '#424242',
    fontWeight: '500',
  },
  dismissBtn: {
    paddingLeft: 12,
    paddingTop: 2,
  },
  dismissText: {
    fontSize: 14,
    color: '#BDBDBD',
    fontWeight: '600',
  },
});
