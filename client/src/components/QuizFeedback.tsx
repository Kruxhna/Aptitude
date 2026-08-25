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
import { theme } from '../theme';
import { SymbolView } from 'expo-symbols';
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
  xp_gained = 10,
  explanation,
  strategyTip,
  onContinue,
}: QuizFeedbackProps) {
  // Banner animations
  const translateY = useSharedValue(300);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  // SPRINTY Robot jump animations
  const robotTranslateY = useSharedValue(0);
  const robotScaleX = useSharedValue(1);
  const robotScaleY = useSharedValue(1);

  const [isDismissing, setIsDismissing] = useState(false);
  const { feedback } = useFeedback();

  useEffect(() => {
    if (visible) {
      setIsDismissing(false);
      // Reset position before entering
      translateX.value = 0;
      scale.value = 1;
      translateY.value = 300;

      // Slide up from bottom with Duolingo bounce spring
      translateY.value = withSpring(0, {
        stiffness: 300,
        damping: 15,
      });

      // ── Multimodal feedback ─────────────────────────────────────────────
      if (isCorrect) {
        // Haptics: heavy impact + success notification (100ms apart)
        feedback.haptics.correctAnswerCombo();
        // Audio: pop sound + mascot jump sound
        feedback.audio.correct();
        feedback.audio.mascotJump();
        // Accessibility: announce after a brief delay so VoiceOver doesn't
        // compete with the banner slide-up animation
        setTimeout(() => {
          feedback.announce(
            `Correct! Well done.${xp_gained > 0 ? ` Plus ${xp_gained} XP.` : ''}`
          );
        }, 300);

        // SPRINTY jump animation
        robotTranslateY.value = withDelay(
          100,
          withSequence(
            withTiming(-40, { duration: 250, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) }),
            withTiming(-18, { duration: 150, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 150, easing: Easing.in(Easing.quad) })
          )
        );
        robotScaleY.value = withDelay(
          100,
          withSequence(
            withTiming(1.2, { duration: 200 }),
            withTiming(0.9, { duration: 100 }),
            withTiming(1.0, { duration: 150 })
          )
        );
      } else {
        // Haptics: double heavy tap for failure
        feedback.haptics.failureDoubleTap();
        // Audio: descending wrong tone
        feedback.audio.wrong();
        // Accessibility: announce the correct answer
        const correctText = explanation
          ? `Incorrect. ${explanation}`
          : 'Incorrect. The correct answer is shown.';
        setTimeout(() => {
          feedback.announce(correctText);
        }, 300);
      }
    } else {
      translateY.value = 300;
    }
  }, [visible, isCorrect]);

  const handleContinue = () => {
    if (isDismissing) return;
    setIsDismissing(true);
    feedback.haptics.mediumTap();
    feedback.audio.buttonTap();

    // Rapidly slide right and scale down to 0, then invoke callback
    translateX.value = withTiming(SCREEN_WIDTH, {
      duration: 250,
      easing: Easing.in(Easing.cubic),
    });
    scale.value = withTiming(0, {
      duration: 250,
      easing: Easing.in(Easing.cubic),
    }, (finished) => {
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

  const backgroundColor = isCorrect ? theme.colors.duoGreenLight : theme.colors.duoRedLight;
  const textColor = isCorrect ? theme.colors.duoGreenDark : theme.colors.duoRedDark;
  const borderColor = isCorrect ? theme.colors.duoGreen : theme.colors.duoRed;
  const titleText = isCorrect ? 'Excellent!' : 'Incorrect';
  const iconName = isCorrect ? 'checkmark.circle.fill' : 'xmark.circle.fill';

  return (
    <Animated.View style={[styles.overlayContainer, bannerAnimatedStyle]}>
      <View style={[styles.bannerCard, { backgroundColor, borderColor, borderWidth: 2, borderBottomWidth: 5, borderBottomColor: borderColor }]}>
        <View style={styles.contentRow}>
          {/* SPRINTY Robot Mascot with Emotion & Active Costume */}
          <Animated.View style={[styles.robotContainer, robotAnimatedStyle]}>
            <SprintyMascot
              size="sm"
              overrideEmotion={isCorrect ? 'EXCITED_JUMP' : 'SAD_HEADSHAKE'}
            />
          </Animated.View>

          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <SymbolView name={iconName} size={28} tintColor={textColor} />
              <Text style={[styles.titleText, { color: textColor }]}>{titleText}</Text>
              {isCorrect && xp_gained > 0 && (
                <View style={styles.xpBadge}>
                  <Text style={styles.xpText}>+{xp_gained} XP</Text>
                </View>
              )}
            </View>

            {strategyTip ? (
              <Text style={styles.strategyTipText}>
                💡 {strategyTip}
              </Text>
            ) : null}

            {explanation ? (
              <Text style={styles.explanationText} numberOfLines={4}>
                {explanation}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Continue Action Button (Duolingo 3D) */}
        <TouchableOpacity
          style={[styles.continueButton, isDismissing && { opacity: 0.7 }, { backgroundColor: isCorrect ? theme.colors.duoGreen : theme.colors.duoRed, borderBottomColor: isCorrect ? theme.colors.duoGreenDark : theme.colors.duoRedDark }]}
          activeOpacity={0.8}
          onPress={handleContinue}
          disabled={isDismissing}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Continue to next question"
          accessibilityState={{ disabled: isDismissing }}
        >
          <Text style={styles.continueButtonText}>
            CONTINUE
          </Text>
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
    borderRadius: 20, // Global shape token: border-radius 20px
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
  },
  robotContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  robotSprite: {
    width: 60,
    height: 60,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  xpBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 6,
  },
  xpText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  strategyTipText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  explanationText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 6,
    lineHeight: 18,
  },
  continueButton: {
    backgroundColor: '#58CC02',
    borderRadius: 16,
    borderBottomWidth: 5,
    borderBottomColor: '#58A700',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
