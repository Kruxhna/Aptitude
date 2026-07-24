import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme';

export default function SprintLauncherScreen() {
  const router = useRouter();

  const startSprint = (type: 'quick' | 'standard' | 'deep') => {
    router.push(`/sprint/${type}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Daily Practice Sprint</Text>
      <Text style={styles.headerSubtitle}>
        Difficulty adapts automatically per skill category
      </Text>

      <View style={styles.cardContainer}>
        {/* Quick Sprint */}
        <TouchableOpacity
          style={styles.sprintCard}
          activeOpacity={0.85}
          onPress={() => startSprint('quick')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Quick Sprint</Text>
            <Text style={styles.badgeText}>5 MIN</Text>
          </View>
          <Text style={styles.cardCount}>5 Questions</Text>
          <Text style={styles.cardDescription}>
            Perfect for a quick daily check-in or brief study break.
          </Text>
        </TouchableOpacity>

        {/* Standard Sprint */}
        <TouchableOpacity
          style={[styles.sprintCard, styles.featuredCard]}
          activeOpacity={0.85}
          onPress={() => startSprint('standard')}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, styles.featuredTitle]}>
              Standard Sprint
            </Text>
            <Text style={[styles.badgeText, styles.featuredBadge]}>RECOMMENDED</Text>
          </View>
          <Text style={styles.cardCount}>10 Questions</Text>
          <Text style={styles.cardDescription}>
            Balanced workout across all GATE skill categories with XP bonus.
          </Text>
        </TouchableOpacity>

        {/* Deep Sprint */}
        <TouchableOpacity
          style={styles.sprintCard}
          activeOpacity={0.85}
          onPress={() => startSprint('deep')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Deep Sprint</Text>
            <Text style={styles.badgeText}>15 MIN</Text>
          </View>
          <Text style={styles.cardCount}>15 Questions</Text>
          <Text style={styles.cardDescription}>
            Comprehensive session designed to push your skill ELO boundaries.
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
  },
  cardContainer: {
    gap: 16,
  },
  sprintCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
  },
  featuredCard: {
    borderColor: colors.accent,
    backgroundColor: '#151738',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  featuredTitle: {
    color: '#818CF8',
  },
  badgeText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: colors.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredBadge: {
    color: '#818CF8',
    backgroundColor: '#312E81',
  },
  cardCount: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
  },
  cardDescription: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
});
