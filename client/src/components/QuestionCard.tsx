import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image } from 'react-native';
import { SkillBadge } from './SkillBadge';
import { ThemedText } from './themed-text';
import { resolveAssetUrl } from '../api';
import { useFeedback } from '../services/FeedbackProvider';
import { useAccessibility } from '../services/AccessibilityProvider';
import { useTheme } from '../hooks/use-theme';
import { duo } from '../theme';

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
  const theme = useTheme();

  let isHighContrast = false;
  try {
    const acc = useAccessibility();
    isHighContrast = acc.isHighContrast;
  } catch {
    // Outside accessibility context
  }

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

        let cardBg = theme.card;
        let cardBorder = theme.cardBorder;
        let cardBottomBorder = isHighContrast ? theme.contrastBorder : '#D5D5D5';

        if (isCorrect) {
          cardBg = theme.duoGreenLight;
          cardBorder = theme.duoGreen;
          cardBottomBorder = theme.duoGreenDark;
        } else if (isIncorrect) {
          cardBg = theme.duoRedLight;
          cardBorder = theme.duoRed;
          cardBottomBorder = theme.duoRedDark;
        }

        return (
          <Pressable
            key={index}
            disabled={isAnswered || isEliminated}
            accessible={true}
            accessibilityRole="radio"
            accessibilityLabel={`Option ${label}: ${opt}. ${
              isCorrect ? 'Correct answer.' : isIncorrect ? 'Incorrect answer.' : ''
            }`}
            accessibilityState={{ checked: isSelected, disabled: isAnswered || isEliminated }}
            onPressIn={() => setHoveredOpt(index)}
            onPressOut={() => setHoveredOpt(null)}
            onPress={() => handleOptionPress(opt)}
            style={[
              styles.optionCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
                borderBottomColor: cardBottomBorder,
                borderWidth: isHighContrast ? 3 : 2,
              },
              isDimmed && styles.optionDimmed,
              hoveredOpt === index && !isAnswered && !isEliminated && styles.optionPressed,
            ]}
          >
            <View style={styles.optionRow}>
              {/* Dual-Encoding Icon / Shape Bullet */}
              <View
                style={[
                  styles.optionBullet,
                  {
                    backgroundColor: isCorrect
                      ? theme.duoGreen
                      : isIncorrect
                      ? theme.duoRed
                      : theme.backgroundElement,
                    borderColor: isCorrect
                      ? theme.duoGreenDark
                      : isIncorrect
                      ? theme.duoRedDark
                      : theme.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.bulletText,
                    {
                      color: isCorrect || isIncorrect ? '#FFFFFF' : theme.textMuted,
                    },
                  ]}
                >
                  {isCorrect ? '✓' : isIncorrect ? '✕' : label}
                </Text>
              </View>

              {/* Option Text */}
              <View style={styles.textColumn}>
                <ThemedText
                  style={[
                    styles.optionText,
                    isCorrect && { color: theme.statusCorrectText, fontWeight: '800' },
                    isIncorrect && { color: theme.statusIncorrectText, fontWeight: '800' },
                    isDimmed && { color: theme.textMuted },
                    isEliminated && styles.optionTextEliminated,
                  ]}
                >
                  {opt}
                </ThemedText>

                {/* Dual-Encoding Text Badges */}
                {isCorrect && (
                  <View style={[styles.statusBadge, { backgroundColor: theme.duoGreen }]}>
                    <Text style={styles.statusBadgeText}>
                      {state === 'revealed-correct' ? '✓ CORRECT ANSWER' : '✓ CORRECT'}
                    </Text>
                  </View>
                )}
                {isIncorrect && (
                  <View style={[styles.statusBadge, { backgroundColor: theme.duoRed }]}>
                    <Text style={styles.statusBadgeText}>✕ INCORRECT</Text>
                  </View>
                )}
                {isEliminated && (
                  <View style={styles.eliminatedBadge}>
                    <Text style={styles.eliminatedBadgeText}>[50/50 ELIMINATED]</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  const renderNumerical = () => (
    <View style={styles.numericalWrap}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            color: theme.text,
            borderWidth: isHighContrast ? 3 : 2,
          },
        ]}
        value={numericalInput}
        onChangeText={setNumericalInput}
        keyboardType="numeric"
        placeholder="Type your answer..."
        placeholderTextColor={theme.textMuted}
        editable={!isAnswered}
        accessible={true}
        accessibilityLabel="Numerical answer input"
        accessibilityHint="Type a number and press CHECK to submit"
      />
      <Pressable
        style={[
          styles.submitBtn,
          {
            backgroundColor: theme.duoGreen,
            borderBottomColor: theme.duoGreenDark,
          },
          isAnswered && { opacity: 0.5 },
        ]}
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
      </Pressable>
    </View>
  );

  const renderSpatial = () => {
    const promptImageUri = resolveAssetUrl(question.imagePath);
    const hasImageOptions = question.imageOptions && question.imageOptions.length > 0;

    return (
      <View style={styles.spatialContainer}>
        {/* Main Prompt Image */}
        {promptImageUri && (
          <View
            style={[
              styles.spatialPromptImageWrap,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                borderWidth: isHighContrast ? 3 : 2,
              },
            ]}
          >
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
            accessibilityLabel="Spatial pattern options"
          >
            {question.imageOptions.map((imgPath: string, index: number) => {
              const optKey = String.fromCharCode(65 + index);
              const state = getOptionState(optKey);
              const isSelected = selectedAnswer === optKey;
              const isEliminated = eliminatedOptions.includes(optKey);
              const isCorrect = state === 'correct' || state === 'revealed-correct';
              const isIncorrect = state === 'incorrect';
              const isDimmed = state === 'dimmed' || isEliminated;
              const optUri = resolveAssetUrl(imgPath);

              let cardBg = theme.card;
              let cardBorder = theme.cardBorder;
              let cardBottomBorder = isHighContrast ? theme.contrastBorder : '#D5D5D5';

              if (isCorrect) {
                cardBg = theme.duoGreenLight;
                cardBorder = theme.duoGreen;
                cardBottomBorder = theme.duoGreenDark;
              } else if (isIncorrect) {
                cardBg = theme.duoRedLight;
                cardBorder = theme.duoRed;
                cardBottomBorder = theme.duoRedDark;
              }

              return (
                <Pressable
                  key={index}
                  disabled={isAnswered || isEliminated}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityLabel={`Option ${optKey}`}
                  accessibilityState={{ checked: isSelected, disabled: isAnswered || isEliminated }}
                  onPress={() => handleOptionPress(optKey)}
                  style={[
                    styles.spatialCard,
                    {
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      borderBottomColor: cardBottomBorder,
                      borderWidth: isHighContrast ? 3 : 2,
                    },
                    isDimmed && styles.optionDimmed,
                  ]}
                >
                  <View
                    style={[
                      styles.spatialBadge,
                      {
                        backgroundColor: isCorrect
                          ? theme.duoGreen
                          : isIncorrect
                          ? theme.duoRed
                          : theme.backgroundElement,
                        borderColor: theme.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.spatialBadgeText,
                        { color: isCorrect || isIncorrect ? '#FFFFFF' : theme.textMuted },
                      ]}
                    >
                      {isCorrect ? '✓' : isIncorrect ? '✕' : optKey}
                    </Text>
                  </View>
                  {optUri && (
                    <Image
                      source={{ uri: optUri }}
                      style={styles.spatialOptionImage}
                      resizeMode="contain"
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        ) : (
          renderMCQ()
        )}
      </View>
    );
  };

  return (
    <View style={styles.cardContainer}>
      {/* Skill Badge & Category Header */}
      <View style={styles.cardHeader}>
        <SkillBadge skill={question.skill} />
        <ThemedText style={[styles.categoryLabel, { color: theme.duoPurple }]}>
          {question.skill?.toUpperCase()}
        </ThemedText>
      </View>

      {/* Question Prompt */}
      <ThemedText style={styles.prompt} type="title">
        {question.prompt || question.text}
      </ThemedText>

      {/* Active Hint Clue Box */}
      {activeHint && (
        <View
          style={[
            styles.hintBox,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.duoGold,
            },
          ]}
        >
          <ThemedText style={[styles.hintTitle, { color: theme.duoGoldDark }]}>
            💡 HINT CLUE
          </ThemedText>
          <ThemedText style={styles.hintText}>{activeHint}</ThemedText>
        </View>
      )}

      {/* Question Renderer by Type */}
      {question.type === 'numerical'
        ? renderNumerical()
        : question.type === 'spatial'
        ? renderSpatial()
        : renderMCQ()}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    paddingVertical: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: duo.fontCaption,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Question Prompt ──
  prompt: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 18,
  },

  // ── Hint Box ──
  hintBox: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  hintTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  hintText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },

  // ── MCQ Options ──
  optionList: {
    gap: 10,
  },
  optionCard: {
    borderRadius: duo.radiusCard,
    borderBottomWidth: duo.depth,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionPressed: {
    borderBottomWidth: 1,
    marginTop: 3,
  },
  optionDimmed: {
    opacity: 0.35,
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  textColumn: {
    flex: 1,
    gap: 4,
  },
  optionBullet: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulletText: {
    fontSize: 15,
    fontWeight: '800',
  },

  optionText: {
    fontSize: duo.fontBody,
    fontWeight: '600',
  },
  optionTextEliminated: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  eliminatedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  eliminatedBadgeText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },

  // ── Numerical ──
  numericalWrap: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    borderRadius: duo.radiusCard,
    borderBottomWidth: duo.depth,
    borderBottomColor: '#D5D5D5',
    padding: 16,
    fontSize: 16,
    fontWeight: '700',
  },
  submitBtn: {
    borderRadius: duo.radiusButton,
    borderBottomWidth: duo.depthButton,
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
    borderRadius: duo.radiusCard,
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
    borderRadius: duo.radiusCard,
    borderBottomWidth: duo.depth,
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
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  spatialBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  spatialOptionImage: {
    width: '85%',
    height: '85%',
  },
});
