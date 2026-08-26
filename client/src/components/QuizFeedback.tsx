import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { SprintyMascot } from './SprintyMascot';
import { ThemedText } from './themed-text';
import { useAccessibility } from '../services/AccessibilityProvider';
import { useTheme } from '../hooks/use-theme';
import { useFeedback } from '../services/FeedbackProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface QuizFeedbackProps {
  visible: boolean;
  isCorrect: boolean;
  xp_gained?: number;
  explanation?: string;
  strategyTip?: string | null;
  onContinue: () => void;
}

export function QuizFeedback({
  visible,
  isCorrect,
  xp_gained = 15,
  explanation,
  strategyTip,
  onContinue,
}: QuizFeedbackProps) {
  const theme = useTheme();
  let isHighContrast = false;
  let isReducedMotion = false;

  try {
    const acc = useAccessibility();
    isHighContrast = acc.isHighContrast;
    isReducedMotion = acc.isReducedMotionActive;
  } catch {
    // Outside accessibility provider
  }

  const { feedback } = useFeedback();
  const [isDismissing, setIsDismissing] = useState(false);

  // Animation values
  const translateY = useSharedValue(200);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const robotTranslateY = useSharedValue(0);
  const robotScaleX = useSharedValue(1);
  const robotScaleY = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      setIsDismissing(false);

      if (isReducedMotion) {
        translateY.value = withTiming(0, { duration: 100 });
        scale.value = withTiming(1, { duration: 100 });
        translateX.value = 0;
        robotTranslateY.value = 0;
      } else {
        // Slide up banner
        translateY.value = withSpring(0, {
          damping: 15,
          stiffness: 180,
          mass: 0.8,
        });

        scale.value = withSequence(
          withTiming(1.03, { duration: 180, easing: Easing.out(Easing.quad) }),
          withSpring(1.0, { damping: 12, stiffness: 200 })
        );

        if (isCorrect) {
          // Mascot celebratory bounce
          robotTranslateY.value = withSequence(
            withDelay(120, withTiming(-18, { duration: 220, easing: Easing.out(Easing.quad) })),
            withSpring(0, { damping: 10, stiffness: 180 })
          );
        } else {
          // Mascot subtle shake
          translateX.value = withSequence(
            withTiming(-6, { duration: 60 }),
            withTiming(6, { duration: 60 }),
            withTiming(-4, { duration: 60 }),
            withTiming(4, { duration: 60 }),
            withTiming(0, { duration: 60 })
          );
        }
      }
    } else {
      translateY.value = 200;
      scale.value = 0.9;
    }
  }, [visible, isCorrect, isReducedMotion]);

  const handleContinue = () => {
    if (isDismissing) return;
    setIsDismissing(true);
    feedback.haptics.mediumTap();
    feedback.audio.buttonTap();

    translateY.value = withTiming(200, { duration: isReducedMotion ? 100 : 250 }, (finished) => {
      if (finished && onContinue) {
        runOnJS(onContinue)();
      }
    });
  };

  const bannerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const robotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: robotTranslateY.value },
      { scaleX: robotScaleX.value },
      { scaleY: robotScaleY.value },
    ],
  }));

  if (!visible) return null;

  const backgroundColor = isCorrect ? theme.duoGreenLight : theme.duoRedLight;
  const textColor = isCorrect ? theme.statusCorrectText : theme.statusIncorrectText;
  const borderColor = isCorrect ? theme.duoGreen : theme.duoRed;
  const borderBottomColor = isCorrect ? theme.duoGreenDark : theme.duoRedDark;
  const titleText = isCorrect ? 'Excellent!' : 'Incorrect';
  const badgeLabel = isCorrect ? '[CORRECT] ✓' : '[INCORRECT] ✕';

  return (
    <Animated.View style={[styles.overlayContainer, bannerAnimatedStyle]}>
      <View
        style={[
          styles.bannerCard,
          {
            backgroundColor,
            borderColor,
            borderWidth: isHighContrast ? 3 : 2,
            borderBottomWidth: isHighContrast ? 5 : 4,
            borderBottomColor,
          },
        ]}
      >
        <View style={styles.contentRow}>
          {/* SPRINTY Robot Mascot with Emotion & Active Costume */}
          <Animated.View style={[styles.robotContainer, robotAnimatedStyle]}>
            <SprintyMascot
              size="sm"
              overrideEmotion={isCorrect ? 'EXCITED_JUMP' : 'SAD_HEADSHAKE'}
            />
          </Animated.View>

          <View style={styles.textContainer}>
            {/* Dual-Encoding Header: Badge + Icon + Text */}
            <View style={styles.titleRow}>
              <View
                style={[
                  styles.dualEncodingBadge,
                  { backgroundColor: isCorrect ? theme.duoGreen : theme.duoRed },
                ]}
              >
                <Text style={styles.dualEncodingBadgeText}>{badgeLabel}</Text>
              </View>
              <ThemedText style={[styles.titleText, { color: textColor }]}>
                {titleText}
              </ThemedText>
              {isCorrect && xp_gained > 0 && (
                <View style={styles.xpBadge}>
                  <Text style={styles.xpText}>+{xp_gained} XP</Text>
                </View>
              )}
            </View>

            {strategyTip ? (
              <ThemedText style={[styles.strategyTipText, { color: textColor }]}>
                💡 {strategyTip}
              </ThemedText>
            ) : null}

            {explanation ? (
              <ThemedText style={styles.explanationText} numberOfLines={4}>
                {explanation}
              </ThemedText>
            ) : null}
          </View>
        </View>

        {/* Continue Action Button (Duolingo 3D) */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            isDismissing && { opacity: 0.7 },
            {
              backgroundColor: isCorrect ? theme.duoGreen : theme.duoRed,
              borderBottomColor: isCorrect ? theme.duoGreenDark : theme.duoRedDark,
              borderWidth: isHighContrast ? 2 : 0,
              borderColor: isHighContrast ? theme.contrastBorder : 'transparent',
            },
          ]}
          activeOpacity={0.8}
          onPress={handleContinue}
          disabled={isDismissing}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Continue to next question"
          accessibilityState={{ disabled: isDismissing }}
        >
          <Text style={styles.continueButtonText}>CONTINUE</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
    zIndex: 100,
    elevation: 20,
  },
  bannerCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  robotContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  dualEncodingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dualEncodingBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '900',
  },
  xpBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  xpText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '800',
  },
  strategyTipText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    opacity: 0.9,
  },
  continueButton: {
    borderRadius: 16,
    borderBottomWidth: 5,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
