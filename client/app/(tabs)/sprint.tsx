import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme';
import { SymbolView } from 'expo-symbols';

export default function SprintLauncherScreen() {
  const router = useRouter();

  const launchSprint = (type: string) => {
    router.push(`/sprint/${type}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Daily Sprint</Text>
      <Text style={styles.subtitle}>Choose your workout length</Text>

      <View style={styles.cards}>
        <TouchableOpacity style={styles.card} onPress={() => launchSprint('quick')}>
          <SymbolView name="bolt.fill" tintColor={theme.colors.primary} size={32} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Quick</Text>
            <Text style={styles.cardDesc}>5 questions • ~3 mins</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => launchSprint('standard')}>
          <SymbolView name="flame.fill" tintColor={theme.colors.success} size={32} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Standard</Text>
            <Text style={styles.cardDesc}>10 questions • ~6 mins</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => launchSprint('deep')}>
          <SymbolView name="brain" tintColor={theme.skillGradients.verbal[0]} size={32} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Deep</Text>
            <Text style={styles.cardDesc}>15 questions • ~10 mins</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 24,
  },
  header: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 16,
    marginTop: 8,
    marginBottom: 40,
  },
  cards: {
    gap: 16,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  cardDesc: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
});
