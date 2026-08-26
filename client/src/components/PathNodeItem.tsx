import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { PathNode, SkillCategory, NodeState } from '../api';
import { colors, duo } from '../theme';
import haptics from '../services/haptics';

interface PathNodeItemProps {
  node: PathNode;
  onPress: (node: PathNode, layout: { x: number; y: number; width: number; height: number; pageX: number; pageY: number }) => void;
  size?: number;
}

// ─── Skill Color Palette ───────────────────────────────────────
const SKILL_THEMES: Record<SkillCategory, { bg: string; shadow: string; light: string; icon: string }> = {
  QUANTITATIVE: {
    bg: '#FF4B4B',
    shadow: '#D32F2F',
    light: '#FFEBEE',
    icon: '⚡',
  },
  VERBAL: {
    bg: '#CE82FF',
    shadow: '#9C27B0',
    light: '#F3E5F5',
    icon: '📖',
  },
  LOGICAL: {
    bg: '#1CB0F6',
    shadow: '#0288D1',
    light: '#E1F5FE',
    icon: '🧠',
  },
  SPATIAL: {
    bg: '#FFC800',
    shadow: '#FFA000',
    light: '#FFFDE7',
    icon: '📐',
  },
};

export const NODE_SIZE = 72;

export function PathNodeItem({ node, onPress, size = NODE_SIZE }: PathNodeItemProps) {
  const containerRef = useRef<View>(null);
  const theme = SKILL_THEMES[node.skill] || SKILL_THEMES.QUANTITATIVE;
  const isLocked = node.state === 'LOCKED';
  const isCurrent = node.state === 'CURRENT';
  const isCompleted = node.state === 'COMPLETED';
  const isPerfect = node.state === 'PERFECT';
  const isReview = node.state === 'REVIEW';

  // ── Shared Animation Values ──────────────────────────────────
  const pressedAnim = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);
  const shimmerPos = useSharedValue(-1);
  const wobbleRotation = useSharedValue(0);
  const startTagBounce = useSharedValue(0);

  // ── Current State Pulsing Loop ──────────────────────────────
  useEffect(() => {
    if (isCurrent) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.32, { duration: 1200, easing: Easing.out(Easing.ease) }),
          withTiming(1.0, { duration: 1200, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.15, { duration: 1200 }),
          withTiming(0.7, { duration: 1200 })
        ),
        -1,
        true
      );
      startTagBounce.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 600, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 600, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
      pulseOpacity.value = 0;
      startTagBounce.value = 0;
    }
  }, [isCurrent]);

  // ── Perfect State Shimmer Loop ───────────────────────────────
  useEffect(() => {
    if (isPerfect) {
      shimmerPos.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
          withTiming(-1, { duration: 0 })
        ),
        -1,
        false
      );
    }
  }, [isPerfect]);

  // ── Review State Wobble Loop ────────────────────────────────
  useEffect(() => {
    if (isReview) {
      wobbleRotation.value = withRepeat(
        withSequence(
          withTiming(4, { duration: 150 }),
          withTiming(-4, { duration: 150 }),
          withTiming(3, { duration: 150 }),
          withTiming(-3, { duration: 150 }),
          withTiming(0, { duration: 150 }),
          withTiming(0, { duration: 2000 }) // pause before next wobble
        ),
        -1,
        false
      );
    }
  }, [isReview]);

  // ── Press Animation ──────────────────────────────────────────
  const handlePressIn = () => {
    pressedAnim.value = withSpring(1, { damping: 15, stiffness: 400 });
    haptics.buttonPress();
  };

  const handlePressOut = () => {
    pressedAnim.value = withSpring(0, { damping: 12, stiffness: 300 });
  };

  const handlePress = () => {
    if (containerRef.current) {
      containerRef.current.measureInWindow((x, y, width, height) => {
        onPress(node, { x, y, width, height, pageX: x, pageY: y });
      });
    }
  };

  // ── Animated Styles ──────────────────────────────────────────
  const chunkyButtonStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressedAnim.value, [0, 1], [0, 5]);
    const bottomWidth = interpolate(pressedAnim.value, [0, 1], [6, 1]);
    const baseScale = isCurrent ? 1.15 : 1.0;

    return {
      transform: [
        { translateY },
        { scale: baseScale },
        { rotate: `${wobbleRotation.value}deg` },
      ],
      borderBottomWidth: bottomWidth,
    };
  });

  const pulseRingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: pulseOpacity.value,
    };
  });

  const startTagAnimStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: startTagBounce.value }],
    };
  });

  // ── Colors and Depth Calculation ─────────────────────────────
  let bgColor = theme.bg;
  let shadowColor = theme.shadow;
  let borderColor = 'transparent';
  let borderWidth = 0;

  if (isLocked) {
    bgColor = '#E5E5EA';
    shadowColor = '#AEAEB2';
  } else if (isPerfect) {
    bgColor = theme.bg;
    shadowColor = '#D4AF37';
    borderColor = '#FFD700';
    borderWidth = 3;
  } else if (isReview) {
    bgColor = theme.bg;
    shadowColor = '#E65100';
    borderColor = '#FF9800';
    borderWidth = 2.5;
  }

  return (
    <View ref={containerRef} style={styles.container} collapsable={false}>
      {/* ── CURRENT "START" Tooltip Badge ── */}
      {isCurrent && (
        <Animated.View style={[styles.startTag, startTagAnimStyle]}>
          <Text style={styles.startTagText}>START</Text>
          <View style={[styles.startTagArrow, { borderTopColor: colors.primary }]} />
        </Animated.View>
      )}

      {/* ── Outer Pulsing Ring for CURRENT ── */}
      {isCurrent && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size + 24,
              height: size + 24,
              borderRadius: (size + 24) / 2,
              borderColor: colors.primary,
              backgroundColor: `${colors.primary}25`,
            },
            pulseRingStyle,
          ]}
        />
      )}

      {/* ── 3D Chunky Circle Button ── */}
      <Animated.View
        style={[
          styles.circleButton,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bgColor,
            borderBottomColor: shadowColor,
            borderColor,
            borderWidth,
            opacity: isLocked ? 0.65 : 1,
          },
          chunkyButtonStyle,
        ]}
      >
        <Pressable
          style={styles.pressableArea}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          hitSlop={8}
        >
          {/* Inner Node Icon & Badges */}
          {isLocked ? (
            <Text style={styles.lockedIcon}>🔒</Text>
          ) : isPerfect ? (
            <View style={styles.iconContainer}>
              <Text style={styles.nodeMainEmoji}>{theme.icon}</Text>
              <View style={styles.perfectStarBadge}>
                <Text style={styles.perfectStarText}>★</Text>
              </View>
            </View>
          ) : isReview ? (
            <View style={styles.iconContainer}>
              <Text style={styles.nodeMainEmoji}>{theme.icon}</Text>
              <View style={styles.reviewBadge}>
                <Text style={styles.reviewBadgeText}>!</Text>
              </View>
            </View>
          ) : isCompleted ? (
            <View style={styles.iconContainer}>
              <Text style={styles.nodeMainEmoji}>{theme.icon}</Text>
              <View style={styles.completedBadge}>
                <Text style={styles.completedCheckText}>✓</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.nodeMainEmoji}>{theme.icon}</Text>
          )}
        </Pressable>
      </Animated.View>

      {/* ── Node Label & Category ── */}
      <View style={styles.labelContainer}>
        <Text
          style={[
            styles.topicTitle,
            isLocked && styles.topicTitleLocked,
            isCurrent && styles.topicTitleCurrent,
          ]}
          numberOfLines={2}
        >
          {node.topic}
        </Text>
        <Text style={[styles.skillCategory, isLocked && styles.skillCategoryLocked]}>
          {node.skill}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    zIndex: 10,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 4,
    zIndex: -1,
  },
  circleButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 6,
  },
  pressableArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  nodeMainEmoji: {
    fontSize: 26,
  },
  lockedIcon: {
    fontSize: 24,
    opacity: 0.7,
  },

  // ── Badges ──
  completedBadge: {
    position: 'absolute',
    bottom: -10,
    right: -12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#58CC02',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  completedCheckText: {
    color: '#58CC02',
    fontSize: 13,
    fontWeight: '900',
  },
  perfectStarBadge: {
    position: 'absolute',
    bottom: -10,
    right: -12,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#FFD700',
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  perfectStarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  reviewBadge: {
    position: 'absolute',
    bottom: -10,
    right: -12,
    backgroundColor: '#FF9800',
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#FF9800',
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
  reviewBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  // ── START Tag ──
  startTag: {
    position: 'absolute',
    top: -34,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 20,
  },
  startTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  startTagArrow: {
    position: 'absolute',
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },

  // ── Labels ──
  labelContainer: {
    marginTop: 8,
    alignItems: 'center',
    maxWidth: 110,
  },
  topicTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 16,
  },
  topicTitleCurrent: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  topicTitleLocked: {
    color: '#8E8E93',
  },
  skillCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  skillCategoryLocked: {
    color: '#C7C7CC',
  },
});
