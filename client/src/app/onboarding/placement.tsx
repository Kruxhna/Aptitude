import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { api, PlacementQuestion } from '../../api';
import { SpriteAnimator } from '../../components/SpriteAnimator';
import { colors, duo } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const TIME_PER_QUESTION = 60; // seconds

export default function PlacementScreen() {
  const router = useRouter();

  // ── State ───────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState('');
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; selectedIndex: number; timeMs: number }[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const questionStartTime = useRef(Date.now());

  // ── Animations ──────────────────────────────────────────────
  const progressWidth = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const cardTranslateX = useSharedValue(0);
  const timerBarWidth = useSharedValue(1);

  // ── Load questions ──────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const [sessionRes, questionsRes] = await Promise.all([
          api.startPlacement(),
          api.getPlacementQuestions(),
        ]);
        setSessionId(sessionRes.sessionId);
        setQuestions(questionsRes.questions);
        progressWidth.value = withTiming(1 / questionsRes.questions.length, { duration: 500 });
      } catch (err) {
        console.error('Failed to load placement:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // ── Timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (loading || showResults || submitting) return;

    setTimeLeft(TIME_PER_QUESTION);
    timerBarWidth.value = 1;
    timerBarWidth.value = withTiming(0, { duration: TIME_PER_QUESTION * 1000, easing: Easing.linear });
    questionStartTime.current = Date.now();

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, loading, showResults]);

  const handleTimeUp = useCallback(() => {
    if (selectedOption === null) {
      // Auto-submit with no answer (-1)
      const elapsed = Date.now() - questionStartTime.current;
      const question = questions[currentIndex];
      if (question) {
        const newAnswers = [...answers, { questionId: question.id, selectedIndex: -1, timeMs: elapsed }];
        setAnswers(newAnswers);
        advanceQuestion(newAnswers);
      }
    }
  }, [selectedOption, currentIndex, questions, answers]);

  // ── Select option ───────────────────────────────────────────
  const handleSelectOption = (optionIndex: number) => {
    if (selectedOption !== null) return; // prevent double-tap
    setSelectedOption(optionIndex);

    const elapsed = Date.now() - questionStartTime.current;
    const question = questions[currentIndex];
    const newAnswers = [...answers, { questionId: question.id, selectedIndex: optionIndex, timeMs: elapsed }];
    setAnswers(newAnswers);

    // Brief pause to show selection, then advance
    setTimeout(() => {
      advanceQuestion(newAnswers);
    }, 600);
  };

  // ── Advance to next question or submit ──────────────────────
  const advanceQuestion = (currentAnswers: typeof answers) => {
    const nextIndex = currentIndex + 1;

    if (nextIndex >= questions.length) {
      // All done — submit
      submitPlacement(currentAnswers);
      return;
    }

    // Slide out animation
    cardOpacity.value = withTiming(0, { duration: 200 });
    cardTranslateX.value = withTiming(-SCREEN_WIDTH, { duration: 250 }, () => {
      // Reset position off-screen right
      cardTranslateX.value = SCREEN_WIDTH;
      runOnJS(setCurrentIndex)(nextIndex);
      runOnJS(setSelectedOption)(null);
      // Slide in
      cardTranslateX.value = withSpring(0, { stiffness: 300, damping: 25 });
      cardOpacity.value = withTiming(1, { duration: 250 });
    });

    progressWidth.value = withSpring((nextIndex + 1) / questions.length, {
      stiffness: 300,
      damping: 15,
    });
  };

  // ── Submit placement ────────────────────────────────────────
  const submitPlacement = async (finalAnswers: typeof answers) => {
    setSubmitting(true);
    try {
      const res = await api.submitPlacement({ sessionId, answers: finalAnswers });
      setResults(res);
      setShowResults(true);
    } catch (err) {
      console.error('Placement submit failed:', err);
      // Navigate anyway on error
      router.replace('/onboarding/goals');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Animated styles ─────────────────────────────────────────
  const progressAnimStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateX: cardTranslateX.value }],
  }));

  const timerAnimStyle = useAnimatedStyle(() => ({
    width: `${timerBarWidth.value * 100}%`,
  }));

  // ── Loading state ───────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <SpriteAnimator
            source={require('../../../assets/sprites/sprinty_idle_hover_sprite.png')}
            style={styles.loadingMascot}
            frameCount={4}
            fps={8}
          />
          <Text style={styles.loadingText}>Preparing your diagnostic test...</Text>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Submitting state ────────────────────────────────────────
  if (submitting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <SpriteAnimator
            source={require('../../../assets/sprites/sprinty_idle_hover_sprite.png')}
            style={styles.loadingMascot}
            frameCount={4}
            fps={8}
          />
          <Text style={styles.loadingText}>Analyzing your skill level...</Text>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Results screen ──────────────────────────────────────────
  if (showResults && results) {
    const skills = ['verbal', 'quantitative', 'logical', 'spatial'];
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultsContainer}>
          <SpriteAnimator
            source={require('../../../assets/sprites/sprinty_correct_jump_sprite.png')}
            style={styles.resultsMascot}
            frameCount={4}
            fps={12}
            loop={false}
          />
          <Text style={styles.resultsTitle}>Diagnostic Complete! 🎯</Text>
          <Text style={styles.resultsSubtitle}>
            {results.totalCorrect}/{results.totalQuestions} correct
          </Text>

          <View style={styles.eloGrid}>
            {skills.map(skill => {
              const elo = results.initialElo?.[skill] || 1200;
              const breakdown = results.skillBreakdown?.[skill];
              return (
                <View key={skill} style={styles.eloCard}>
                  <Text style={styles.eloSkillName}>
                    {skill.charAt(0).toUpperCase() + skill.slice(1)}
                  </Text>
                  <Text style={styles.eloValue}>{Math.round(elo)}</Text>
                  <Text style={[styles.eloStatus, { color: breakdown?.correct ? '#58CC02' : '#FF4B4B' }]}>
                    {breakdown?.correct ? '✓ Correct' : '✗ Incorrect'}
                  </Text>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            activeOpacity={0.8}
            onPress={() => router.replace('/onboarding/goals')}
          >
            <Text style={styles.continueButtonText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Quiz UI ─────────────────────────────────────────────────
  const question = questions[currentIndex];
  if (!question) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PLACEMENT TEST</Text>
        <Text style={styles.headerCounter}>
          Question {currentIndex + 1} of {questions.length}
        </Text>
      </View>

      {/* ── Progress Bar ── */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressAnimStyle]} />
      </View>

      {/* ── Timer Bar ── */}
      <View style={styles.timerTrack}>
        <Animated.View
          style={[
            styles.timerFill,
            timerAnimStyle,
            { backgroundColor: timeLeft > 20 ? '#FFC800' : timeLeft > 10 ? '#FF9600' : '#FF4B4B' },
          ]}
        />
      </View>
      <Text style={styles.timerText}>{timeLeft}s</Text>

      {/* ── Question Card ── */}
      <Animated.View style={[styles.questionCard, cardAnimStyle]}>
        <View style={styles.skillTag}>
          <Text style={styles.skillTagText}>{question.skill.toUpperCase()}</Text>
        </View>

        <Text style={styles.questionPrompt}>{question.prompt}</Text>

        <View style={styles.optionsContainer}>
          {question.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                activeOpacity={0.7}
                onPress={() => handleSelectOption(idx)}
                disabled={selectedOption !== null}
              >
                <View style={[styles.optionLetter, isSelected && styles.optionLetterSelected]}>
                  <Text style={[styles.optionLetterText, isSelected && { color: '#FFF' }]}>
                    {OPTION_LETTERS[idx]}
                  </Text>
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // ── Loading ─────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingMascot: {
    width: 100,
    height: 100,
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3C3C3C',
    marginBottom: 16,
    textAlign: 'center',
  },
  // ── Header ──────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#AFAFAF',
    letterSpacing: 1.5,
  },
  headerCounter: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3C3C3C',
  },
  // ── Progress ────────────────────
  progressTrack: {
    height: 10,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 20,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFC800',
    borderRadius: 5,
  },
  // ── Timer ───────────────────────
  timerTrack: {
    height: 6,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: 3,
  },
  timerText: {
    textAlign: 'right',
    marginRight: 20,
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#AFAFAF',
  },
  // ── Question Card ───────────────
  questionCard: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  skillTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#CE82FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  skillTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  questionPrompt: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3C3C3C',
    lineHeight: 28,
    marginBottom: 24,
  },
  // ── Options ─────────────────────
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  optionCardSelected: {
    borderColor: colors.primary || '#00C4B4',
    borderBottomColor: '#0F766E',
    backgroundColor: '#E0FFF9',
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionLetterSelected: {
    backgroundColor: colors.primary || '#00C4B4',
  },
  optionLetterText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#AFAFAF',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#3C3C3C',
    lineHeight: 22,
  },
  optionTextSelected: {
    color: '#0F766E',
    fontWeight: '700',
  },
  // ── Results ─────────────────────
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  resultsMascot: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3C3C3C',
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#AFAFAF',
    marginBottom: 32,
  },
  eloGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 40,
  },
  eloCard: {
    width: (SCREEN_WIDTH - 72) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#E5E5E5',
    padding: 16,
    alignItems: 'center',
  },
  eloSkillName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#AFAFAF',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  eloValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3C3C3C',
    marginBottom: 2,
  },
  eloStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  // ── Continue Button ─────────────
  continueButton: {
    width: '100%',
    backgroundColor: colors.primary || '#00C4B4',
    paddingVertical: 16,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: '#0F766E',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
