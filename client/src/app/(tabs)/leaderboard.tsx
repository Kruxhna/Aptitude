import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { api, LeaderboardResponse } from '../../api';
import { colors, duo } from '../../theme';

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'VINEET', xp: 1520 },
  { rank: 2, name: 'PRIYA', xp: 1480 },
  { rank: 3, name: 'ALEX', xp: 1430 },
  { rank: 4, name: 'SIDDHARTH', xp: 1360, isUser: true },
  { rank: 5, name: 'RIYA', xp: 1290 },
  { rank: 6, name: 'KARAN', xp: 1210 },
];

const RANK_MEDALS = ['👑', '🥈', '🥉'];

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
    } catch {
      // fallback to mock
    } finally {
      setLoading(false);
    }
  };

  const list =
    data?.leaderboard && data.leaderboard.length > 0
      ? data.leaderboard.map((item: any, idx: number) => ({
          rank: item.rank || idx + 1,
          name:
            item.userId === '000000000000000000000001'
              ? 'SIDDHARTH'
              : `USER ${(item.userId || '').slice(-4).toUpperCase()}`,
          xp: item.xp,
          isUser: item.userId === '000000000000000000000001',
        }))
      : MOCK_LEADERBOARD;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── League Banner (Duolingo-style) ── */}
      <View style={styles.leagueBanner}>
        <Text style={styles.leagueIcon}>🛡️</Text>
        <View>
          <Text style={styles.leagueName}>TITAN LEAGUE</Text>
          <Text style={styles.leagueSub}>Top 10 advance · Reset in 4 days</Text>
        </View>
      </View>

      {/* ── Leaderboard List ── */}
      <View style={styles.list}>
        {list.map((item, idx) => {
          const isUser = item.isUser || item.name === 'SIDDHARTH';
          const medal = idx < 3 ? RANK_MEDALS[idx] : null;

          return (
            <View
              key={idx}
              style={[
                styles.row,
                isUser && styles.rowUser,
                // 3D depth on each row
                {
                  borderBottomWidth: duo.depthCard,
                  borderBottomColor: isUser ? colors.primaryDark : '#D5D5D5',
                },
              ]}
            >
              {/* Rank */}
              <View style={styles.rankCol}>
                {medal ? (
                  <Text style={styles.medal}>{medal}</Text>
                ) : (
                  <Text style={[styles.rankNum, isUser && styles.textWhite]}>
                    {item.rank}
                  </Text>
                )}
              </View>

              {/* Avatar */}
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: isUser ? 'rgba(255,255,255,0.3)' : '#F7F7F7' },
                ]}
              >
                <Text style={styles.avatarText}>
                  {item.name.charAt(0)}
                </Text>
              </View>

              {/* Name */}
              <Text
                style={[styles.name, isUser && styles.textWhite]}
                numberOfLines={1}
              >
                {item.name}
              </Text>

              {/* XP */}
              <Text style={[styles.xp, isUser && styles.textWhite]}>
                {item.xp} XP
              </Text>
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
    padding: 16,
    paddingBottom: 40,
  },

  // ── League Banner ──
  leagueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: duo.radiusCard,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: duo.depthCard + 2,
    borderBottomColor: '#D5D5D5',
    padding: 20,
    marginBottom: 20,
    gap: 16,
  },
  leagueIcon: {
    fontSize: 40,
  },
  leagueName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  leagueSub: {
    fontSize: duo.fontCaption,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 2,
  },

  // ── List ──
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: duo.radiusCard,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowUser: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },

  rankCol: {
    width: 28,
    alignItems: 'center',
  },
  rankNum: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  medal: {
    fontSize: 20,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMuted,
  },

  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  xp: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
  },
  textWhite: {
    color: '#FFFFFF',
  },
});
