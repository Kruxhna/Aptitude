import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '../../src/api';
import { theme } from '../../src/theme';
import { SymbolView } from 'expo-symbols';

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // In a real app with auth, this would be the logged-in user's ID
  const MOCK_CURRENT_USER_ID = 'user-1'; 

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await api.getLeaderboard();
        setLeaderboard(data.leaderboard);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderRankBadge = (rank: number) => {
    let color = theme.colors.textMuted;
    if (rank === 1) color = '#FFD700'; // Gold
    else if (rank === 2) color = '#C0C0C0'; // Silver
    else if (rank === 3) color = '#CD7F32'; // Bronze

    return (
      <View style={[styles.rankBadge, { borderColor: color }]}>
        <Text style={[styles.rankText, { color }]}>{rank}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly League</Text>
        <Text style={styles.subtitle}>Group 1</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {leaderboard.map((entry, index) => {
          const isCurrentUser = entry.userId === MOCK_CURRENT_USER_ID;
          return (
            <View 
              key={entry.userId} 
              style={[styles.row, isCurrentUser && styles.currentUserRow]}
            >
              <View style={styles.rankContainer}>
                {renderRankBadge(index + 1)}
              </View>
              <View style={styles.userContainer}>
                <SymbolView 
                  name="person.crop.circle.fill" 
                  size={32} 
                  tintColor={isCurrentUser ? theme.colors.primary : theme.colors.textMuted} 
                />
                <Text style={[styles.userName, isCurrentUser && styles.currentUserName]}>
                  {entry.userId}
                  {isCurrentUser && ' (You)'}
                </Text>
              </View>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>{entry.weeklyXP} XP</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 16,
    marginTop: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  currentUserRow: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // primary color with opacity
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  userContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 12,
  },
  userName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  currentUserName: {
    color: theme.colors.primary,
  },
  scoreContainer: {
    paddingLeft: 16,
  },
  scoreText: {
    color: theme.colors.success,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
