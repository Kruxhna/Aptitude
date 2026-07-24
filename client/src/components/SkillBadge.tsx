import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { skillGradients, skillNames, colors } from '../theme';

interface SkillBadgeProps {
  skill: string;
  size?: 'small' | 'medium' | 'large';
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({ skill, size = 'medium' }) => {
  const gradient = skillGradients[skill.toLowerCase()] || ['#6366F1', '#4F46E5'];
  const displayName = skillNames[skill.toLowerCase()] || skill.toUpperCase();

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.badge,
        isSmall && styles.badgeSmall,
        isLarge && styles.badgeLarge,
      ]}
    >
      <Text
        style={[
          styles.text,
          isSmall && styles.textSmall,
          isLarge && styles.textLarge,
        ]}
      >
        {displayName}
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textSmall: {
    fontSize: 10,
  },
  textLarge: {
    fontSize: 14,
  },
});
