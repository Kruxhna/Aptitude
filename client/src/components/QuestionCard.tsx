import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
} from 'react-native';
import { Question } from '../api';
import { SkillBadge } from './SkillBadge';
import { colors } from '../theme';

interface QuestionCardProps {
  question: Question;
  onAnswer: (answer: any) => void;
  selectedAnswer: any;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onAnswer,
  selectedAnswer,
}) => {
  const [numInput, setNumInput] = useState<string>('');

  const handleMCQSelect = (index: number) => {
    onAnswer(index);
  };

  const handleNumericalSubmit = () => {
    if (numInput.trim() !== '') {
      onAnswer(numInput.trim());
    }
  };

  const handleSpatialSelect = (index: number) => {
    onAnswer(index);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <SkillBadge skill={question.skill} size="small" />
        <Text style={styles.difficulty}>
          Difficulty: {question.difficulty} ELO
        </Text>
      </View>

      <Text style={styles.prompt}>{question.prompt}</Text>

      {/* MCQ Question */}
      {question.type === 'mcq' && question.options && (
        <View style={styles.optionsContainer}>
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => handleMCQSelect(idx)}
              >
                <View
                  style={[
                    styles.optionBadge,
                    isSelected && styles.optionBadgeSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLetter,
                      isSelected && styles.optionLetterSelected,
                    ]}
                  >
                    {String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Numerical Question */}
      {question.type === 'numerical' && (
        <View style={styles.numericalContainer}>
          <TextInput
            style={styles.numericInput}
            value={numInput}
            onChangeText={setNumInput}
            placeholder="Type numeric answer..."
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            autoFocus
          />
          <TouchableOpacity
            style={[
              styles.submitButton,
              !numInput.trim() && styles.buttonDisabled,
            ]}
            onPress={handleNumericalSubmit}
            disabled={!numInput.trim()}
          >
            <Text style={styles.submitButtonText}>Submit Answer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Spatial Question */}
      {question.type === 'spatial' && (
        <View style={styles.spatialGrid}>
          {(question.imageGrid || question.options || ['A', 'B', 'C', 'D']).map(
            (item, idx) => {
              const isSelected = selectedAnswer === idx;
              const isImageUrl = item.startsWith('http');
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.spatialOption,
                    isSelected && styles.optionSelected,
                  ]}
                  onPress={() => handleSpatialSelect(idx)}
                >
                  {isImageUrl ? (
                    <Image
                      source={{ uri: item }}
                      style={styles.spatialImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.spatialText}>
                      Option {String.fromCharCode(65 + idx)}: {item}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            }
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  difficulty: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  prompt: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 14,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: '#1E1B4B',
  },
  optionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionBadgeSelected: {
    backgroundColor: colors.accent,
  },
  optionLetter: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },
  optionLetterSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    color: colors.text,
    fontSize: 15,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  numericalContainer: {
    gap: 12,
  },
  numericInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 18,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  spatialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  spatialOption: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  spatialImage: {
    width: '100%',
    height: '100%',
  },
  spatialText: {
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
  },
});
