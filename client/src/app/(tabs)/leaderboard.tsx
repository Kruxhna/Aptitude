import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { api, LeaderboardResponse } from '../../api';

const MOCK_LEADERBOARD_ITEMS = [
  { rank: 1, name: 'VINEET', xp: 1520, avatar: 'person.crop.circle.fill' },
  { rank: 2, name: 'PRIYA', xp: 1480, avatar: 'person.crop.circle.fill' },
  { rank: 3, name: 'ALEX', xp: 1430, avatar: 'person.crop.circle.fill' },
  { rank: 4, name: 'SIDDHARTH', xp: 1360, avatar: 'person.crop.circle.fill', isUser: true },
];

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

  const leaderboardList = data?.leaderboard && data.leaderboard.length > 0
    ? data.leaderboard.map((item, idx) => ({
        rank: item.rank || idx + 1,
        name: item.userId === '000000000000000000000001' ? 'SIDDHARTH' : `USER ${item.userId.slice(-4).toUpperCase()}`,
        xp: item.xp,
        isUser: item.userId === '000000000000000000000001',
      }))
    : MOCK_LEADERBOARD_ITEMS;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Hero Banner: TITAN LEAGUE */}
      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.diamondBadge}>
            <SymbolView name="diamond.fill" size={32} tintColor="#8B5CF6" />
          </View>
          <Text style={styles.heroTitle}>TITAN LEAGUE</Text>
        </View>
      </View>

      {/* Subtitle Countdown */}
      <Text style={styles.resetCountdown}>RESET IN 4 DAYS</Text>

      {/* Leaderboard Rankings List */}
      <View style={styles.listContainer}>
        {leaderboardList.map((item, idx) => {
          const isUser = item.isUser || item.name === 'SIDDHARTH';

          return (
            <View
              key={idx}
              style={[
                styles.userRow,
                isUser ? styles.userRowHighlighted : styles.userRowStandard,
              ]}
            >
              <Text style={[styles.rankNumber, isUser && styles.userTextHighlighted]}>
                {item.rank}.
              </Text>

              <View style={styles.avatarContainer}>
                <SymbolView
                  name="person.crop.circle.fill"
                  size={28}
                  tintColor={isUser ? '#FFFFFF' : '#94A3B8'}
                />
              </View>

              <Text style={[styles.userName, isUser && styles.userTextHighlighted]}>
                {item.name}
              </Text>

              <Text style={[styles.userXp, isUser && styles.userTextHighlighted]}>
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
    backgroundColor: '#EDF2F7',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  diamondBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1,
  },
  resetCountdown: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 20,
  },
  listContainer: {
    gap: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  userRowStandard: {
    backgroundColor: '#FFFFFF',
  },
  userRowHighlighted: {
    backgroundColor: '#00C4B4', // Vibrant Teal matching reference image
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    width: 24,
  },
  avatarContainer: {
    marginHorizontal: 12,
  },
  userName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  userXp: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
  },
  userTextHighlighted: {
    color: '#FFFFFF',
  },
});
