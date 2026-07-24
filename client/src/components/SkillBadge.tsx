import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface SkillBadgeProps {
  skill: 'verbal' | 'quantitative' | 'logical' | 'spatial';
}

export function SkillBadge({ skill }: SkillBadgeProps) {
  const gradient = theme.skillGradients[skill] || theme.skillGradients.verbal;

  return (
    <LinearGradient
      colors={gradient as unknown as string[]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.badge}
    >
      <Text style={styles.text}>{skill.toUpperCase()}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
