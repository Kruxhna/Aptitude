import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SkillBadge } from './SkillBadge';
import { theme } from '../theme';

interface QuestionCardProps {
  question: any;
  onAnswer: (answer: string) => void;
}

export function QuestionCard({ question, onAnswer }: QuestionCardProps) {
  const [numericalInput, setNumericalInput] = useState('');

  const renderInput = () => {
    switch (question.type) {
      case 'mcq':
        return (
          <View style={styles.mcqContainer}>
            {question.options?.map((opt: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => onAnswer(opt)}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case 'numerical':
        return (
          <View style={styles.numericalContainer}>
            <TextInput
              style={styles.input}
              value={numericalInput}
              onChangeText={setNumericalInput}
              keyboardType="numeric"
              placeholder="Enter number..."
              placeholderTextColor={theme.colors.textMuted}
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => {
                if (numericalInput.trim()) onAnswer(numericalInput.trim());
              }}
            >
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        );
      case 'spatial':
        return (
          <View style={styles.spatialContainer}>
            {question.options?.map((opt: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.spatialOptionButton}
                onPress={() => onAnswer(opt)}
              >
                {/* Fallback to text if image logic isn't built yet */}
                <Text style={styles.spatialOptionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.card}>
      <SkillBadge skill={question.skill} />
      <Text style={styles.prompt}>{question.prompt}</Text>
      {renderInput()}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    marginVertical: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  prompt: {
    color: theme.colors.text,
    fontSize: 18,
    marginVertical: 20,
    lineHeight: 26,
  },
  mcqContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
  },
  optionText: {
    color: theme.colors.text,
    fontSize: 16,
  },
  numericalContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    color: theme.colors.text,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spatialContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  spatialOptionButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spatialOptionText: {
    color: theme.colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
});
