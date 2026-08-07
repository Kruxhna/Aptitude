import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, RADII, SPRING } from '../theme';

interface WrongAnswerExplanationProps {
  selectedAnswer: string | number;       // What the user chose
  correctAnswer: string | number;        // The right answer
  options?: string[];                    // MCQ option labels
  explanation: string;                   // General explanation from Question.explanation
  wrongAnswerExplanations?: Record<string, string> | null; // Per-option explanations
  conceptExplanation?: string | null;    // Full concept explanation (from MicroLesson)
  minDisplaySeconds?: number;            // Min seconds before Continue is enabled (default 5)
  onContinue: () => void;
}

/**
 * WrongAnswerExplanation
 * Slide-up card shown after a wrong answer in Learn mode.
 * Shows per-option "why not" explanations, correct answer highlighted,
 * and optionally expands to full concept explanation.
 * Enforces a minimum display time before allowing Continue.
 */
export default function WrongAnswerExplanation({
  selectedAnswer,
  correctAnswer,
  options,
  explanation,
  wrongAnswerExplanations,
  conceptExplanation,
  minDisplaySeconds = 5,
  onContinue,
}: WrongAnswerExplanationProps) {
  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);
  const [expanded, setExpanded] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const expandHeight = useSharedValue(0);

  useEffect(() => {
    // Entrance
    translateY.value = withSpring(0, SPRING.bounce);
    opacity.value = withTiming(1, { duration: 250 });

    // Enable Continue after min display time
    const timer = setTimeout(() => setCanContinue(true), minDisplaySeconds * 1000);
    return () => clearTimeout(timer);
  }, []);

  const expandStyle = useAnimatedStyle(() => ({
    maxHeight: withSpring(expanded ? 400 : 0, { damping: 18, stiffness: 200 }),
    opacity: withTiming(expanded ? 1 : 0, { duration: 200 }),
    overflow: 'hidden',
  }));

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getOptionLabel = (index: number) =>
    String.fromCharCode(65 + index); // 0 → 'A', 1 → 'B', etc.

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.wrongBadge}>✗ Incorrect</Text>
          <Text style={styles.headerSub}>Let's understand why</Text>
        </View>

        {/* Answer comparison */}
        <View style={styles.answerRow}>
          <View style={[styles.answerPill, styles.wrongPill]}>
            <Text style={styles.answerPillLabel}>Your answer</Text>
            <Text style={styles.answerPillValue}>
              {typeof selectedAnswer === 'number' && options
                ? `${getOptionLabel(selectedAnswer)}. ${options[selectedAnswer]}`
                : String(selectedAnswer)}
            </Text>
          </View>
          <View style={[styles.answerPill, styles.correctPill]}>
            <Text style={styles.answerPillLabel}>Correct answer</Text>
            <Text style={styles.answerPillValue}>
              {typeof correctAnswer === 'number' && options
                ? `${getOptionLabel(correctAnswer as number)}. ${options[correctAnswer as number]}`
                : String(correctAnswer)}
            </Text>
          </View>
        </View>

        {/* Wrong answer specific explanation */}
        {wrongAnswerExplanations && typeof selectedAnswer === 'number' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Why your answer was wrong</Text>
            <Text style={styles.explanationText}>
              {wrongAnswerExplanations[getOptionLabel(selectedAnswer)] ||
                explanation}
            </Text>
          </View>
        )}

        {/* General explanation */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Key concept</Text>
          <Text style={styles.explanationText}>{explanation}</Text>
        </View>

        {/* Expandable concept section */}
        {conceptExplanation && (
          <>
            <TouchableOpacity
              style={styles.learnMoreBtn}
              onPress={() => setExpanded(e => !e)}
              accessibilityLabel={expanded ? 'Collapse concept' : 'Learn more'}
            >
              <Text style={styles.learnMoreText}>
                {expanded ? '▲ Show less' : '▼ Learn more'}
              </Text>
            </TouchableOpacity>

            <Animated.View style={expandStyle}>
              <View style={styles.conceptBox}>
                <Text style={styles.conceptText}>{conceptExplanation}</Text>
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* Continue button */}
      <TouchableOpacity
        style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
        onPress={canContinue ? onContinue : undefined}
        accessibilityLabel="Continue to next question"
      >
        <Text style={styles.continueBtnText}>
          {canContinue ? 'CONTINUE' : `Wait ${minDisplaySeconds}s…`}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  header: {
    marginBottom: 16,
  },
  wrongBadge: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F44336',
  },
  headerSub: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  answerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  answerPill: {
    flex: 1,
    borderRadius: RADII.card,
    padding: 12,
  },
  wrongPill: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#EF9A9A',
  },
  correctPill: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  answerPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
    color: '#757575',
  },
  answerPillValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212121',
    lineHeight: 18,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9E9E9E',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#424242',
  },
  learnMoreBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    marginBottom: 8,
  },
  learnMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1565C0',
  },
  conceptBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: RADII.card,
    padding: 14,
    marginBottom: 12,
  },
  conceptText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#424242',
  },
  continueBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: RADII.card,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: '#BDBDBD',
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
