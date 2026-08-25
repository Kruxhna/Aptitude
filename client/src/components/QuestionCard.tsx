import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Pressable, Image } from 'react-native';
import { SkillBadge } from './SkillBadge';
import { theme } from '../theme';
import { colors, duo } from '../theme';
import { resolveAssetUrl } from '../api';
import { useFeedback } from '../services/FeedbackProvider';

interface QuestionCardProps {
  question: any;
  onAnswer: (answer: string) => void;
  selectedAnswer?: any;
  eliminatedOptions?: string[];
  activeHint?: string | null;
}

export function QuestionCard({
  question,
  onAnswer,
  selectedAnswer,
  eliminatedOptions = [],
  activeHint,
}: QuestionCardProps) {
  const [numericalInput, setNumericalInput] = useState('');
  const [hoveredOpt, setHoveredOpt] = useState<number | null>(null);
  const { feedback } = useFeedback();

  const isAnswered = selectedAnswer !== null && selectedAnswer !== undefined;
  const correctAnswer = question.correctAnswer;

  const getOptionState = (opt: string) => {
    if (!isAnswered) return 'default';
    // User picked this option and it's right
    if (opt === selectedAnswer && (opt === correctAnswer || correctAnswer === undefined)) return 'correct';
    // User picked this option and it's wrong
    if (opt === selectedAnswer && opt !== correctAnswer) return 'incorrect';
    // User picked wrong, but this option is the actual correct answer -> reveal it
    if (opt === correctAnswer) return 'revealed-correct';
    return 'dimmed';
  };

  const handleOptionPress = (opt: string) => {
    if (isAnswered || eliminatedOptions.includes(opt)) return;

    const isCorrect = correctAnswer !== undefined ? opt === correctAnswer : true;
    if (isCorrect) {
      feedback.haptics.correctAnswerCombo();
      feedback.audio.correct();
    } else {
      feedback.haptics.failureDoubleTap();
      feedback.audio.wrong();
    }

    onAnswer(opt);
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
        const isEliminated = eliminatedOptions.includes(opt);
        const label = String.fromCharCode(65 + index);

        // Option styles based on state
        const isCorrect = state === 'correct' || state === 'revealed-correct';
        const isIncorrect = state === 'incorrect';
        const isDimmed = state === 'dimmed' || isEliminated;

        return (
          <Pressable
            key={index}
            disabled={isAnswered || isEliminated}
            accessible={true}
            accessibilityRole="radio"
            accessibilityLabel={`Option ${label}: ${opt}`}
            accessibilityState={{ checked: isSelected, disabled: isAnswered || isEliminated }}
            onPressIn={() => setHoveredOpt(index)}
            onPressOut={() => setHoveredOpt(null)}
            onPress={() => handleOptionPress(opt)}
            style={[
              styles.optionCard,
              isCorrect && styles.optionCorrect,
              isIncorrect && styles.optionIncorrect,
              isDimmed && styles.optionDimmed,
              hoveredOpt === index && !isAnswered && !isEliminated && styles.optionPressed,
            ]}
          >
            <View style={styles.optionRow}>
              <View
                style={[
                  styles.optionBullet,
                  isCorrect && styles.bulletCorrect,
                  isIncorrect && styles.bulletIncorrect,
                ]}
              >
                <Text
                  style={[
                    styles.bulletText,
                    (isCorrect || isIncorrect) && styles.bulletTextActive,
                  ]}
                >
                  {isCorrect ? '✓' : isIncorrect ? '✕' : label}
                </Text>
              </View>

              <Text
                style={[
                  styles.optionText,
                  isCorrect && styles.optionTextCorrect,
                  isIncorrect && styles.optionTextIncorrect,
                  isDimmed && styles.optionTextDimmed,
                  isEliminated && styles.optionTextEliminated,
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
            handleOptionPress(numericalInput.trim());
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

  const renderSpatial = () => {
    const promptImageUri = resolveAssetUrl(question.imagePath);
    const hasImageOptions = question.imageOptions && question.imageOptions.length > 0;

    return (
      <View style={styles.spatialContainer}>
        {/* Main Prompt Image */}
        {promptImageUri && (
          <View style={styles.spatialPromptImageWrap}>
            <Image
              source={{ uri: promptImageUri }}
              style={styles.spatialPromptImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Spatial Options Grid (Image options or text options) */}
        {hasImageOptions ? (
          <View
            style={styles.spatialGrid}
            accessible={true}
            accessibilityRole="radiogroup"
            accessibilityLabel="Spatial answer options"
          >
            {question.imageOptions.map((imgOpt: string, index: number) => {
              const optKey = question.options ? question.options[index] : String.fromCharCode(65 + index);
              const state = getOptionState(optKey);
              const isSelected = selectedAnswer === optKey;
              const isEliminated = eliminatedOptions.includes(optKey);
              const optImageUri = resolveAssetUrl(imgOpt);
              const label = String.fromCharCode(65 + index);

              const isCorrect = state === 'correct' || state === 'revealed-correct';
              const isIncorrect = state === 'incorrect';
              const isDimmed = state === 'dimmed' || isEliminated;

              return (
                <Pressable
                  key={index}
                  disabled={isAnswered || isEliminated}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityLabel={`Option ${label}`}
                  accessibilityState={{ checked: isSelected, disabled: isAnswered || isEliminated }}
                  onPress={() => handleOptionPress(optKey)}
                  style={[
                    styles.spatialCard,
                    isCorrect && styles.optionCorrect,
                    isIncorrect && styles.optionIncorrect,
                    isDimmed && styles.optionDimmed,
                    isSelected && styles.optionPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.spatialBadge,
                      isCorrect && styles.bulletCorrect,
                      isIncorrect && styles.bulletIncorrect,
                    ]}
                  >
                    <Text
                      style={[
                        styles.spatialBadgeText,
                        (isCorrect || isIncorrect) && styles.bulletTextActive,
                      ]}
                    >
                      {isCorrect ? '✓' : isIncorrect ? '✕' : label}
                    </Text>
                  </View>
                  {optImageUri ? (
                    <Image
                      source={{ uri: optImageUri }}
                      style={[styles.spatialOptionImage, isEliminated && { opacity: 0.25 }]}
                      resizeMode="contain"
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View
            style={styles.spatialGrid}
            accessible={true}
            accessibilityRole="radiogroup"
            accessibilityLabel="Spatial answer options"
          >
            {question.options?.map((opt: string, index: number) => {
              const state = getOptionState(opt);
              const isEliminated = eliminatedOptions.includes(opt);
              const label = String.fromCharCode(65 + index);

              const isCorrect = state === 'correct' || state === 'revealed-correct';
              const isIncorrect = state === 'incorrect';
              const isDimmed = state === 'dimmed' || isEliminated;

              return (
                <Pressable
                  key={index}
                  disabled={isAnswered || isEliminated}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityLabel={`Option ${label}: ${opt}`}
                  accessibilityState={{ checked: selectedAnswer === opt, disabled: isAnswered || isEliminated }}
                  onPress={() => handleOptionPress(opt)}
                  style={[
                    styles.spatialCard,
                    isCorrect && styles.optionCorrect,
                    isIncorrect && styles.optionIncorrect,
                    isDimmed && styles.optionDimmed,
                  ]}
                >
                  <Text
                    style={[
                      styles.spatialText,
                      isCorrect && styles.optionTextCorrect,
                      isIncorrect && styles.optionTextIncorrect,
                      isDimmed && styles.optionTextDimmed,
                      isEliminated && styles.optionTextEliminated,
                    ]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    );
  };

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

      {/* Question Prompt */}
      <Text
        style={styles.prompt}
        accessible={true}
        accessibilityLiveRegion="polite"
        accessibilityRole="text"
        accessibilityLabel={question.prompt || question.text}
      >
        {question.prompt || question.text}
      </Text>

      {/* Active Hint Clue Banner (if revealed) */}
      {activeHint && (
        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>💡 HINT</Text>
          <Text style={styles.hintText}>{activeHint}</Text>
        </View>
      )}

      {/* Answer Options */}
      {renderInput()}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingTop: 12,
  },

  // ── Category Tag ──
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
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
    lineHeight: 30,
    marginBottom: 18,
  },

  // ── Hint Box ──
  hintBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  hintTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  hintText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    fontWeight: '500',
  },

  // ── MCQ Options ──
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
    backgroundColor: '#DCFCE7', // Emerald light
    borderColor: '#22C55E',     // Emerald primary
    borderBottomColor: '#16A34A',
  },
  optionIncorrect: {
    backgroundColor: '#FEE2E2', // Ruby light
    borderColor: '#EF4444',     // Ruby primary
    borderBottomColor: '#DC2626',
  },
  optionDimmed: {
    opacity: 0.35,
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionBullet: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  bulletCorrect: {
    backgroundColor: '#22C55E',
    borderColor: '#16A34A',
  },
  bulletIncorrect: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  bulletText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textMuted,
  },
  bulletTextActive: {
    color: '#FFFFFF',
    fontSize: 16,
  },

  optionText: {
    color: colors.text,
    fontSize: duo.fontBody,
    fontWeight: '600',
    flex: 1,
  },
  optionTextCorrect: {
    color: '#15803D',
    fontWeight: '800',
  },
  optionTextIncorrect: {
    color: '#B91C1C',
    fontWeight: '800',
  },
  optionTextDimmed: {
    color: colors.textMuted,
  },
  optionTextEliminated: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
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
  spatialContainer: {
    gap: 16,
  },
  spatialPromptImageWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: duo.radiusCard,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: duo.depthCard + 2,
    borderBottomColor: '#D5D5D5',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    marginBottom: 8,
  },
  spatialPromptImage: {
    width: '100%',
    height: 160,
  },
  spatialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  spatialCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: duo.radiusCard,
    borderBottomWidth: duo.depth,
    borderBottomColor: '#D5D5D5',
    padding: 10,
    width: '48%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  spatialBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  spatialBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
  },
  spatialOptionImage: {
    width: '85%',
    height: '85%',
  },
  spatialText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
