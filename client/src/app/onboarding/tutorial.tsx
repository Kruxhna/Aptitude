import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeInUp,
  FadeInDown,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { api } from '../../api';
import { SprintyMascot } from '../../components/SprintyMascot';
import { colors, duo } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorialStep {
  id: string;
  title: string;
  body: string;
  emoji: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'intro',
    title: "Hi! I'm SPRINTY! 🤖",
    body: "I'll be your daily practice companion.\nLet's crack GATE Aptitude together!",
    emoji: '👋',
  },
  {
    id: 'features',
    title: 'Your Daily Sprint',
    body: 'Every day you get a personalized quiz sprint.\nI match questions to your skill level so you grow faster!',
    emoji: '⚡',
  },
  {
    id: 'demo',
    title: "Let's Try It!",
    body: "Here's what a sprint question looks like.\nTap an option to see the magic!",
    emoji: '🎯',
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [demoTapped, setDemoTapped] = useState(false);

  // ── Ghost finger animation for step 3 ──────────────────────
  const fingerY = useSharedValue(0);
  const fingerOpacity = useSharedValue(1);

  React.useEffect(() => {
    if (currentStep === 2 && !demoTapped) {
      // Bounce finger up and down to hint at tapping
      fingerY.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    }
  }, [currentStep, demoTapped]);

  const fingerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: fingerY.value }],
    opacity: fingerOpacity.value,
  }));

  // ── Navigation ──────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      flatListRef.current?.scrollToIndex({ index: nextStep, animated: true });
    }
  }, [currentStep]);

  const handleSkip = useCallback(async () => {
    await finishOnboarding();
  }, []);

  const handleStartSprint = useCallback(async () => {
    await finishOnboarding();
  }, []);

  const finishOnboarding = async () => {
    setCompleting(true);
    try {
      await api.completeOnboarding();
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    }
    router.replace('/(tabs)');
  };

  const handleDemoTap = () => {
    if (demoTapped) return;
    setDemoTapped(true);
    fingerOpacity.value = withTiming(0, { duration: 300 });
  };

  // ── Render steps ────────────────────────────────────────────
  const renderStep = ({ item, index }: { item: TutorialStep; index: number }) => {
    return (
      <View style={styles.stepContainer}>
        {/* Step 1: Mascot intro */}
        {index === 0 && (
          <View style={styles.stepContent}>
            <Animated.View entering={FadeInUp.delay(200).springify()}>
              <SprintyMascot size="lg" overrideEmotion="EXCITED_JUMP" />
            </Animated.View>
            <Animated.Text entering={FadeInUp.delay(500).springify()} style={styles.stepTitle}>
              {item.title}
            </Animated.Text>
            <Animated.Text entering={FadeInUp.delay(700).springify()} style={styles.stepBody}>
              {item.body}
            </Animated.Text>
          </View>
        )}

        {/* Step 2: Feature highlights */}
        {index === 1 && (
          <View style={styles.stepContent}>
            <Animated.View entering={FadeInUp.delay(150).springify()} style={{ marginBottom: 12 }}>
              <SprintyMascot size="md" overrideEmotion="IDLE_HOVER" />
            </Animated.View>
            <View style={styles.featureCards}>
              {[
                { icon: '🎯', label: 'Adaptive ELO', desc: 'Questions match your level' },
                { icon: '🔥', label: 'Streaks', desc: 'Stay consistent, earn rewards' },
                { icon: '🏆', label: 'Leaderboard', desc: 'Compete with other aspirants' },
              ].map((feature, fi) => (
                <Animated.View
                  key={feature.label}
                  entering={FadeInDown.delay(300 + fi * 200).springify()}
                  style={styles.featureCard}
                >
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                  <View style={styles.featureInfo}>
                    <Text style={styles.featureLabel}>{feature.label}</Text>
                    <Text style={styles.featureDesc}>{feature.desc}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>
            <Text style={styles.stepTitle}>{item.title}</Text>
            <Text style={styles.stepBody}>{item.body}</Text>
          </View>
        )}

        {/* Step 3: Demo question */}
        {index === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{item.title}</Text>
            <Text style={styles.stepBody}>{item.body}</Text>

            {/* Mock question card */}
            <View style={styles.demoCard}>
              <View style={styles.demoSkillTag}>
                <Text style={styles.demoSkillTagText}>QUANTITATIVE</Text>
              </View>
              <Text style={styles.demoPrompt}>
                If 3 taps fill a tank in 6 hours, how long do 2 taps take?
              </Text>
              <View style={styles.demoOptions}>
                {['6 hours', '9 hours', '4 hours', '12 hours'].map((opt, oi) => {
                  const isCorrect = oi === 1;
                  const isActive = demoTapped && isCorrect;
                  return (
                    <TouchableOpacity
                      key={oi}
                      style={[
                        styles.demoOption,
                        isActive && styles.demoOptionCorrect,
                        demoTapped && !isCorrect && oi !== 1 && styles.demoOptionDimmed,
                      ]}
                      onPress={handleDemoTap}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.demoOptionText, isActive && { color: '#58CC02', fontWeight: '700' }]}>
                        {opt}
                      </Text>
                      {isActive && <Text style={styles.demoCheckmark}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Ghost finger */}
              {!demoTapped && (
                <Animated.View style={[styles.ghostFinger, fingerAnimStyle]}>
                  <Text style={styles.ghostFingerEmoji}>👆</Text>
                </Animated.View>
              )}

              {demoTapped && (
                <Animated.View entering={FadeInUp.springify()} style={styles.demoBanner}>
                  <Text style={styles.demoBannerText}>Correct! 🎉</Text>
                </Animated.View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={TUTORIAL_STEPS}
        renderItem={renderStep}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* ── Bottom Bar ── */}
      <View style={styles.bottomBar}>
        {/* Dots */}
        <View style={styles.dots}>
          {TUTORIAL_STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentStep && styles.dotActive]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

          {isLastStep ? (
            <TouchableOpacity
              style={[styles.primaryButton, completing && { opacity: 0.6 }]}
              activeOpacity={0.8}
              onPress={handleStartSprint}
              disabled={completing}
            >
              <Text style={styles.primaryButtonText}>
                {completing ? 'LOADING...' : 'START SPRINT 🚀'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={goNext}
            >
              <Text style={styles.primaryButtonText}>NEXT</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // ── Steps ──────────────────────
  stepContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  largeMascot: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#3C3C3C',
    textAlign: 'center',
    marginBottom: 10,
  },
  stepBody: {
    fontSize: 16,
    fontWeight: '500',
    color: '#AFAFAF',
    textAlign: 'center',
    lineHeight: 24,
  },
  // ── Feature cards (step 2) ─────
  featureCards: {
    width: '100%',
    gap: 12,
    marginBottom: 28,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  featureInfo: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3C3C3C',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: '#AFAFAF',
  },
  // ── Demo question (step 3) ─────
  demoCard: {
    width: '100%',
    marginTop: 24,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#E5E5E5',
    padding: 18,
    backgroundColor: '#FAFAFA',
  },
  demoSkillTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#CE82FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 12,
  },
  demoSkillTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 1,
  },
  demoPrompt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3C3C3C',
    marginBottom: 16,
    lineHeight: 22,
  },
  demoOptions: {
    gap: 8,
  },
  demoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  demoOptionCorrect: {
    borderColor: '#58CC02',
    backgroundColor: '#D7FFB8',
  },
  demoOptionDimmed: {
    opacity: 0.5,
  },
  demoOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3C3C3C',
  },
  demoCheckmark: {
    fontSize: 16,
    fontWeight: '700',
    color: '#58CC02',
  },
  ghostFinger: {
    position: 'absolute',
    bottom: 85,
    right: 60,
  },
  ghostFingerEmoji: {
    fontSize: 32,
  },
  demoBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#D7FFB8',
    alignItems: 'center',
  },
  demoBannerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#58CC02',
  },
  // ── Bottom Bar ─────────────────
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5E5',
  },
  dotActive: {
    backgroundColor: colors.primary || '#00C4B4',
    width: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#AFAFAF',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.primary || '#00C4B4',
    borderBottomWidth: 4,
    borderBottomColor: '#0F766E',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
