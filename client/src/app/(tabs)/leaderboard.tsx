import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useLeaderboardStore } from '../../stores/useLeaderboardStore';
import { colors, duo } from '../../theme';

const MOCK_LEADERBOARD = [
  { rank: 1, displayName: 'VINEET', xp: 1520, isCurrentUser: false },
  { rank: 2, displayName: 'PRIYA', xp: 1480, isCurrentUser: false },
  { rank: 3, displayName: 'ALEX', xp: 1430, isCurrentUser: false },
  { rank: 4, displayName: 'SIDDHARTH (YOU)', xp: 1360, isCurrentUser: true },
  { rank: 5, displayName: 'RIYA', xp: 1290, isCurrentUser: false },
  { rank: 6, displayName: 'KARAN', xp: 1210, isCurrentUser: false },
];

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  // Granular atomic selectors
  const leaderboard = useLeaderboardStore((s) => s.leaderboard);
  const currentLeague = useLeaderboardStore((s) => s.currentLeague);
  const isLoading = useLeaderboardStore((s) => s.isLoading);
  const fetchLeaderboard = useLeaderboardStore((s) => s.fetchLeaderboard);

  useEffect(() => {
    fetchLeaderboard().catch(() => {});
  }, [fetchLeaderboard]);

  const onRefresh = async () => {
    await fetchLeaderboard(true);
  };

  const list = leaderboard && leaderboard.length > 0 ? leaderboard : (MOCK_LEADERBOARD as any);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundSoft }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* ── League Banner (Duolingo-style) ── */}
      <View
        style={[
          styles.leagueBanner,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
            borderBottomColor: '#D5D5D5',
          },
        ]}
      >
        <Text style={styles.leagueIcon}>🛡️</Text>
        <View>
          <Text style={[styles.leagueName, { color: colors.duoGoldDark }]}>
            {currentLeague?.toUpperCase() || 'BRONZE'} LEAGUE
          </Text>
          <Text style={[styles.leagueSub, { color: colors.textMuted }]}>
            Top 10 advance · Weekly Reset in 4 days
          </Text>
        </View>
      </View>

      {/* ── Leaderboard List ── */}
      <View style={styles.list}>
        {list.map((item: any, idx: number) => {
          const isUser = Boolean(item.isCurrentUser);
          const medal = idx < 3 ? RANK_MEDALS[idx] : null;

          return (
            <View
              key={idx}
              style={[
                styles.row,
                {
                  backgroundColor: isUser ? colors.primary : colors.card,
                  borderColor: isUser ? colors.primaryDark : colors.cardBorder,
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
                  <Text style={[styles.rankNum, isUser ? styles.textWhite : { color: colors.text }]}>
                    {item.rank}
                  </Text>
                )}
              </View>

              {/* Avatar */}
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: isUser
                      ? 'rgba(255,255,255,0.3)'
                      : colors.backgroundElement,
                  },
                ]}
              >
                <Text style={styles.avatarEmoji}>
                  {item.activeCostume === 'SPACE_HELMET'
                    ? '🚀'
                    : item.activeCostume === 'WIZARD_HAT'
                    ? '🧙'
                    : item.activeCostume === 'GOLDEN_CROWN'
                    ? '👑'
                    : '🤖'}
                </Text>
              </View>

              {/* Name */}
              <Text
                style={[
                  styles.name,
                  isUser ? styles.nameUser : { color: colors.text },
                ]}
              >
                {item.displayName || 'GATE Aspirant'}
              </Text>

              {/* XP Pill */}
              <View
                style={[
                  styles.xpPill,
                  {
                    backgroundColor: isUser
                      ? 'rgba(255,255,255,0.2)'
                      : colors.backgroundElement,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.xpText,
                    isUser ? styles.textWhite : { color: colors.duoGoldDark },
                  ]}
                >
                  ⚡ {item.xp || 0} XP
                </Text>
              </View>
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
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  leagueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: duo.radiusCard,
    borderWidth: 2,
    borderBottomWidth: 4,
    padding: 16,
    gap: 14,
    marginBottom: 16,
  },
  leagueIcon: {
    fontSize: 36,
  },
  leagueName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  leagueSub: {
    fontSize: 12,
    marginTop: 2,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: duo.radiusCard,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  rankCol: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medal: {
    fontSize: 22,
  },
  rankNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  nameUser: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  xpPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
