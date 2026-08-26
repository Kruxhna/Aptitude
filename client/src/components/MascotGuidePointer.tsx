import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  FadeIn,
  FadeOut,
  FadeInUp,
} from 'react-native-reanimated';
import { SprintyMascot } from './SprintyMascot';
import { MascotEmotion } from '../mascot/types';
import { colors, duo } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface MascotGuidePointerProps {
  visible: boolean;
  title?: string;
  message: string;
  targetLayout?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  pointerPosition?: 'top' | 'bottom' | 'left' | 'right';
  mascotEmotion?: MascotEmotion;
  ctaText?: string;
  onNext?: () => void;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function MascotGuidePointer({
  visible,
  title,
  message,
  targetLayout,
  pointerPosition = 'bottom',
  mascotEmotion = 'EXCITED_JUMP',
  ctaText = 'Got It! 👍',
  onNext,
  onDismiss,
  style,
}: MascotGuidePointerProps) {
  const fingerOffset = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Continuous bouncing pointer gesture
      fingerOffset.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 400, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
        ),
        -1,
        true
      );

      // Target highlight pulse
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 600, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0, { duration: 600, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const pointerAnimStyle = useAnimatedStyle(() => ({
    transform: [
      pointerPosition === 'top' || pointerPosition === 'bottom'
        ? { translateY: fingerOffset.value }
        : { translateX: fingerOffset.value },
    ],
  }));

  const targetHighlightStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[styles.overlay, style]}
    >
      {/* Target Focus Ring if layout provided */}
      {targetLayout && (
        <Animated.View
          style={[
            styles.targetHighlight,
            {
              left: targetLayout.x - 6,
              top: targetLayout.y - 6,
              width: targetLayout.width + 12,
              height: targetLayout.height + 12,
            },
            targetHighlightStyle,
          ]}
        />
      )}

      {/* Floating Mascot Guide Card */}
      <Animated.View
        entering={FadeInUp.springify().damping(14).stiffness(120)}
        style={styles.cardContainer}
      >
        <View style={styles.cardHeader}>
          <SprintyMascot size="sm" overrideEmotion={mascotEmotion} />
          <View style={styles.textColumn}>
            {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
            <Text style={styles.cardMessage}>{message}</Text>
          </View>
        </View>

        {/* Animated Pointing Hand */}
        <Animated.View style={[styles.pointerHandContainer, pointerAnimStyle]}>
          <Text style={styles.pointerEmoji}>
            {pointerPosition === 'top'
              ? '👇'
              : pointerPosition === 'bottom'
              ? '👆'
              : pointerPosition === 'left'
              ? '👉'
              : '👈'}
          </Text>
        </Animated.View>

        {/* Action Button */}
        <View style={styles.cardFooter}>
          {onDismiss && (
            <TouchableOpacity onPress={onDismiss} style={styles.skipBtn}>
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={onNext || onDismiss}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>{ctaText}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    padding: 20,
  },
  targetHighlight: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    zIndex: 1001,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: 6,
    borderBottomColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 1002,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textColumn: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    fontWeight: '500',
  },
  pointerHandContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  pointerEmoji: {
    fontSize: 28,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  ctaBtn: {
    backgroundColor: colors.duoGreen,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderBottomWidth: 4,
    borderBottomColor: colors.duoGreenDark,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
