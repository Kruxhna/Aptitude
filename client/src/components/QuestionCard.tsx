import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Pressable } from 'react-native';
import { SkillBadge } from './SkillBadge';
import { theme } from '../theme';
import { colors, duo } from '../theme';
import { useFeedback } from '../services/FeedbackProvider';

interface QuestionCardProps {
  question: any;
  onAnswer: (answer: string) => void;
  selectedAnswer?: any;
}

export function QuestionCard({ question, onAnswer, selectedAnswer }: QuestionCardProps) {
  const [numericalInput, setNumericalInput] = useState('');
  const [hoveredOpt, setHoveredOpt] = useState<number | null>(null);
  const { feedback } = useFeedback();

  const isAnswered = selectedAnswer !== null && selectedAnswer !== undefined;
  const correctAnswer = question.correctAnswer;

  const getOptionState = (opt: string) => {
    if (!isAnswered) return 'default';
    if (opt === correctAnswer) return 'correct';
    if (opt === selectedAnswer && opt !== correctAnswer) return 'incorrect';
    return 'dimmed';
  };

  const renderMCQ = () => (
    <View
      style={styles.optionList}
      accessible={true}
      accessibilityRole="radiogroup"
      accessibilityLabel="Answer options"
    >
      {question.options?.map((opt: string, index: number) => {
        const state = getOptionState(opt);
        const isSelected = selectedAnswer === opt;
        const label = String.fromCharCode(65 + index);
        return (
          <Pressable
            key={index}
            disabled={isAnswered}
            accessible={true}
            accessibilityRole="radio"
            accessibilityLabel={`Option ${label}: ${opt}`}
            accessibilityState={{ checked: isSelected, disabled: isAnswered }}
            onPressIn={() => setHoveredOpt(index)}
            onPressOut={() => setHoveredOpt(null)}
            onPress={() => {
              if (!isAnswered) {
                feedback.haptics.lightTap();
                feedback.audio.buttonTap();
                onAnswer(opt);
              }
            }}
            style={[
              styles.optionCard,
              state === 'correct' && styles.optionCorrect,
              state === 'incorrect' && styles.optionIncorrect,
              state === 'dimmed' && styles.optionDimmed,
              hoveredOpt === index && !isAnswered && styles.optionPressed,
            ]}
          >
            <View style={styles.optionRow}>
              <View
                style={[
                  styles.optionBullet,
                  state === 'correct' && styles.bulletCorrect,
                  state === 'incorrect' && styles.bulletIncorrect,
                ]}
              >
                <Text
                  style={[
                    styles.bulletText,
                    (state === 'correct' || state === 'incorrect') &&
                      styles.bulletTextActive,
                  ]}
                >
                  {label}
                </Text>
              </View>
              <Text
                style={[
                  styles.optionText,
                  state === 'correct' && styles.optionTextCorrect,
                  state === 'incorrect' && styles.optionTextIncorrect,
                  state === 'dimmed' && styles.optionTextDimmed,
                ]}
              >
                {opt}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  const renderNumerical = () => (
    <View style={styles.numericalWrap}>
      <TextInput
        style={styles.input}
        value={numericalInput}
        onChangeText={setNumericalInput}
        keyboardType="numeric"
        placeholder="Type your answer..."
        placeholderTextColor={colors.textMuted}
        editable={!isAnswered}
        accessible={true}
        accessibilityLabel="Numerical answer input"
        accessibilityHint="Type a number and press CHECK to submit"
      />
      <TouchableOpacity
        style={[styles.submitBtn, isAnswered && { opacity: 0.5 }]}
        onPress={() => {
          if (numericalInput.trim() && !isAnswered) {
            feedback.haptics.mediumTap();
            feedback.audio.buttonTap();
            onAnswer(numericalInput.trim());
          }
        }}
        disabled={isAnswered}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Check answer"
      >
        <Text style={styles.submitBtnText}>CHECK</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSpatial = () => (
    <View
      style={styles.spatialGrid}
      accessible={true}
      accessibilityRole="radiogroup"
      accessibilityLabel="Spatial answer options"
    >
      {question.options?.map((opt: string, index: number) => {
        const state = getOptionState(opt);
        const isSelected = selectedAnswer === opt;
        return (
          <Pressable
            key={index}
            disabled={isAnswered}
            accessible={true}
            accessibilityRole="radio"
            accessibilityLabel={`Option ${String.fromCharCode(65 + index)}: ${opt}`}
            accessibilityState={{ checked: isSelected, disabled: isAnswered }}
            onPress={() => {
              if (!isAnswered) {
                feedback.haptics.lightTap();
                feedback.audio.buttonTap();
                onAnswer(opt);
              }
            }}
            style={[
              styles.spatialCard,
              state === 'correct' && styles.optionCorrect,
              state === 'incorrect' && styles.optionIncorrect,
              state === 'dimmed' && styles.optionDimmed,
            ]}
          >
            <Text
              style={[
                styles.spatialText,
                state === 'correct' && styles.optionTextCorrect,
              ]}
            >
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderInput = () => {
    switch (question.type) {
      case 'mcq':
        return renderMCQ();
      case 'numerical':
        return renderNumerical();
      case 'spatial':
        return renderSpatial();
      default:
        return renderMCQ(); // fallback
    }
  };

  return (
    <View style={styles.card}>
      {/* Category Tag */}
      <View style={styles.categoryRow}>
        <SkillBadge skill={question.skill} />
        <Text style={styles.categoryLabel}>
          {(question.skill || 'APTITUDE').toUpperCase()}
        </Text>
      </View>

      {/* Question Prompt — live region so VoiceOver announces new questions */}
      <Text
        style={styles.prompt}
        accessible={true}
        accessibilityLiveRegion="polite"
        accessibilityRole="text"
        accessibilityLabel={question.prompt || question.text}
      >
        {question.prompt || question.text}
      </Text>

      {/* Answer Options */}
      {renderInput()}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingTop: 16,
  },

  // ── Category Tag ──
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: duo.fontCaption,
    fontWeight: '700',
    color: colors.duoPurple,
    letterSpacing: 0.5,
  },

  // ── Question Prompt ──
  prompt: {
    color: colors.text,
    fontSize: duo.fontTitle,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 24,
  },

  // ── MCQ Options (Duolingo r12 card style) ──
  optionList: {
    gap: 10,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: duo.radiusCard,
    borderBottomWidth: duo.depth,
    borderBottomColor: '#D5D5D5',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionPressed: {
    borderBottomWidth: 1,
    marginTop: 3,
  },
  optionCorrect: {
    backgroundColor: colors.duoGreenLight,
    borderColor: colors.duoGreen,
    borderBottomColor: colors.duoGreenDark,
  },
  optionIncorrect: {
    backgroundColor: colors.duoRedLight,
    borderColor: colors.duoRed,
    borderBottomColor: colors.duoRedDark,
  },
  optionDimmed: {
    opacity: 0.4,
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionBullet: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulletCorrect: {
    backgroundColor: colors.duoGreen,
    borderColor: colors.duoGreenDark,
  },
  bulletIncorrect: {
    backgroundColor: colors.duoRed,
    borderColor: colors.duoRedDark,
  },
  bulletText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  bulletTextActive: {
    color: '#FFFFFF',
  },

  optionText: {
    color: colors.text,
    fontSize: duo.fontBody,
    fontWeight: '500',
    flex: 1,
  },
  optionTextCorrect: {
    color: colors.duoGreenDark,
    fontWeight: '700',
  },
  optionTextIncorrect: {
    color: colors.duoRedDark,
    fontWeight: '700',
  },
  optionTextDimmed: {
    color: colors.textMuted,
  },

  // ── Numerical ──
  numericalWrap: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: duo.radiusCard,
    borderBottomWidth: duo.depth,
    borderBottomColor: '#D5D5D5',
    padding: 16,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: colors.duoGreen,
    borderRadius: duo.radiusButton,
    borderBottomWidth: duo.depthButton,
    borderBottomColor: colors.duoGreenDark,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Spatial ──
  spatialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  spatialCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: duo.radiusCard,
    borderBottomWidth: duo.depth,
    borderBottomColor: '#D5D5D5',
    padding: 16,
    width: '47%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spatialText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
