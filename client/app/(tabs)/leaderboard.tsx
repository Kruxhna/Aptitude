import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { api, LeaderboardResponse } from '../../src/api';
import { colors } from '../../src/theme';

export default function LeaderboardScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeaderboardResponse | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.getLeaderboard();
      setData(res);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading weekly leaderboard...</Text>
      </View>
    );
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.leagueBanner}>
        <Text style={styles.leagueTitle}>Weekly Standings</Text>
        <Text style={styles.leagueSubtitle}>
          League: {data?.leagueId || 'Static Group 1'}
        </Text>
      </View>

      {data?.userRank && (
        <View style={styles.userHighlightCard}>
          <Text style={styles.userHighlightText}>
            Your Current Standing: Rank #{data.userRank.rank} ({data.userRank.xp} XP)
          </Text>
        </View>
      )}

      <View style={styles.listCard}>
        {data?.leaderboard.map((item, idx) => {
          const isCurrentUser =
            item.userId === '000000000000000000000001' ||
            item.userId.includes('user');

          return (
            <View
              key={item.userId || idx}
              style={[
                styles.userRow,
                isCurrentUser && styles.currentUserRow,
                idx === (data.leaderboard.length - 1) && styles.lastRow,
              ]}
            >
              <View style={styles.rankContainer}>
                <Text style={styles.rankBadge}>{getRankBadge(item.rank)}</Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={[styles.userName, isCurrentUser && styles.currentUserName]}>
                  User {item.userId.slice(-6)}
                  {isCurrentUser ? ' (You)' : ''}
                </Text>
              </View>

              <Text style={styles.xpText}>{item.xp} XP</Text>
            </View>
          );
        })}
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
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 12,
    fontSize: 15,
  },
  leagueBanner: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 18,
    marginBottom: 16,
  },
  leagueTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  leagueSubtitle: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  userHighlightCard: {
    backgroundColor: '#1E1B4B',
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  userHighlightText: {
    color: '#818CF8',
    fontWeight: '700',
    fontSize: 14,
  },
  listCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  currentUserRow: {
    backgroundColor: '#1A2138',
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
  },
  rankBadge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  currentUserName: {
    color: colors.accent,
    fontWeight: '700',
  },
  xpText: {
    color: colors.warning,
    fontSize: 15,
    fontWeight: '700',
  },
});
