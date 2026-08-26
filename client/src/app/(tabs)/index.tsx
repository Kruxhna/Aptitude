import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../stores/useUserStore';
import { usePathStore } from '../../stores/usePathStore';
import { SpriteAnimator } from '../../components/SpriteAnimator';
import { colors, duo } from '../../theme';
import { PathNode, NodeState, SkillCategory } from '../../api';

// ─── Default Skill Nodes for Fallback ─────────────────────────
const DEFAULT_SKILL_NODES: PathNode[] = [
  {
    id: 'node-1',
    skill: 'QUANTITATIVE',
    topic: 'Algebra & Ratios',
    description: 'Master linear equations and ratios.',
    questionCount: 5,
    estimatedMinutes: 4,
    state: 'COMPLETED',
    isBranch: false,
    position: { x: 0, y: 0 },
    accuracy: 1.0,
  },
  {
    id: 'node-2',
    skill: 'VERBAL',
    topic: 'Vocabulary & Context',
    description: 'Core word power and contextual synonyms.',
    questionCount: 5,
    estimatedMinutes: 3,
    state: 'CURRENT',
    isBranch: false,
    position: { x: 40, y: 1 },
  },
  {
    id: 'node-3',
    skill: 'LOGICAL',
    topic: 'Deductive Syllogisms',
    description: 'Venn deductions and logical inference.',
    questionCount: 5,
    estimatedMinutes: 4,
    state: 'LOCKED',
    isBranch: false,
    position: { x: -40, y: 2 },
  },
  {
    id: 'node-4',
    skill: 'SPATIAL',
    topic: '2D & 3D Rotations',
    description: 'Visual symmetry, mirrors, and projections.',
    questionCount: 5,
    estimatedMinutes: 4,
    state: 'LOCKED',
    isBranch: false,
    position: { x: 30, y: 3 },
  },
  {
    id: 'node-5',
    skill: 'QUANTITATIVE',
    topic: 'Speed & Time',
    description: 'Relative speed, trains, and circular tracks.',
    questionCount: 5,
    estimatedMinutes: 5,
    state: 'LOCKED',
    isBranch: false,
    position: { x: 0, y: 4 },
  },
];

const SKILL_ICONS: Record<string, string> = {
  QUANTITATIVE: '📐',
  VERBAL: '📖',
  LOGICAL: '🧩',
  SPATIAL: '🎲',
};

const SKILL_COLORS: Record<string, { bg: string; dark: string }> = {
  QUANTITATIVE: { bg: colors.duoRed, dark: colors.duoRedDark },
  VERBAL: { bg: colors.duoPurple, dark: '#A855F7' },
  LOGICAL: { bg: colors.duoBlue, dark: '#1899D6' },
  SPATIAL: { bg: colors.duoGold, dark: colors.duoGoldDark },
};

function ChunkyNode({
  node,
  onPress,
}: {
  node: PathNode;
  onPress: () => void;
}) {
  const isCompleted = node.state === 'COMPLETED' || node.state === 'PERFECT';
  const isCurrent = node.state === 'CURRENT';
  const isLocked = node.state === 'LOCKED';

  const skillColor = SKILL_COLORS[node.skill] || { bg: colors.duoGreen, dark: colors.duoGreenDark };

  const bg = isLocked ? '#E5E5E5' : isCompleted ? colors.duoGreen : skillColor.bg;
  const dark = isLocked ? '#C4C4C4' : isCompleted ? colors.duoGreenDark : skillColor.dark;
  const icon = isLocked ? '🔒' : isCompleted ? '✓' : SKILL_ICONS[node.skill] || '⭐';

  return (
    <View style={[styles.nodeWrapper, { transform: [{ translateX: node.position?.x || 0 }] }]}>
      {isCurrent && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>START HERE</Text>
          <View style={styles.tooltipArrow} />
        </View>
      )}

      <TouchableOpacity
        activeOpacity={isLocked ? 1 : 0.85}
        disabled={isLocked}
        onPress={onPress}
      >
        <View style={[styles.outerRing, isCurrent && { borderColor: colors.duoGold, borderWidth: 4 }]}>
          <View
            style={[
              styles.chunkyCircle,
              {
                backgroundColor: bg,
                borderBottomColor: dark,
              },
            ]}
          >
            <Text style={styles.nodeIcon}>{icon}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <Text style={[styles.nodeTitle, isLocked && styles.nodeTitleLocked]}>
        {node.topic}
      </Text>
      <Text style={styles.nodeCategory}>{node.skill}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  // Granular atomic Zustand selectors
  const streakCount = useUserStore((s) => s.currentStreak);
  const totalXp = useUserStore((s) => s.totalXp);
  const userElo = useUserStore((s) => s.elo);
  const isPendingSync = useUserStore((s) => s.isPendingSync);
  const fetchUserProfile = useUserStore((s) => s.fetchUserProfile);

  const storeNodes = usePathStore((s) => s.nodes);
  const fetchPathTree = usePathStore((s) => s.fetchPathTree);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPathTree().catch(() => {});
    fetchUserProfile().catch(() => {});
  }, [fetchPathTree, fetchUserProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchPathTree(true).catch(() => {}),
      fetchUserProfile().catch(() => {}),
    ]);
    setRefreshing(false);
  }, [fetchPathTree, fetchUserProfile]);

  const nodes = storeNodes.length > 0 ? storeNodes : DEFAULT_SKILL_NODES;
  const completedCount = nodes.filter(
    (n) => n.state === 'COMPLETED' || n.state === 'PERFECT' || n.state === 'REVIEW'
  ).length;
  const progressPct = Math.round((completedCount / nodes.length) * 100);

  const avgElo = Math.round(
    ((userElo.verbal || 1000) +
      (userElo.quantitative || 1000) +
      (userElo.logical || 1000) +
      (userElo.spatial || 1000)) /
      4
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ─── Top Stat Header ─── */}
      <View style={styles.topBar}>
        <View style={styles.statPill}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={[styles.statNum, { color: '#FF9600' }]}>{streakCount}</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statEmoji}>⚡</Text>
          <Text style={[styles.statNum, { color: '#FFC800' }]}>
            {totalXp.toLocaleString()}
          </Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statEmoji}>🎯</Text>
          <Text style={[styles.statNum, { color: '#1CB0F6' }]}>{avgElo}</Text>
        </View>
      </View>

      {/* Offline Pending Sync Banner */}
      {isPendingSync && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncBannerText}>
            ☁️ Pending offline sync — will update when back online
          </Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ─── Mascot + Speech Bubble ─── */}
        <View style={styles.mascotRow}>
          <SpriteAnimator
            source={require('../../../assets/sprites/sprinty_idle_hover_sprite.png')}
            style={styles.mascotImg}
            frameCount={4}
            fps={8}
          />
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>
              Ready for today's{'\n'}GATE sprint?
            </Text>
            <View style={styles.speechArrow} />
          </View>
        </View>

        {/* ─── Daily Sprint CTA (3D chunky button) ─── */}
        <View style={styles.sprintCard}>
          <View style={styles.sprintRow}>
            <View>
              <Text style={styles.sprintTag}>DAILY SPRINT</Text>
              <Text style={styles.sprintTitle}>Personalized Practice</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {progressPct}% complete · {completedCount}/{nodes.length} lessons
          </Text>

          {/* 3D Start Button */}
          <TouchableOpacity
            style={styles.startBtn}
            activeOpacity={0.9}
            onPress={() => router.push('/sprint/standard' as any)}
          >
            <View style={styles.startBtnInner}>
              <Text style={styles.startBtnText}>START SPRINT</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── Section: Learning Path ─── */}
        <Text style={styles.sectionHeader}>LEARNING PATH</Text>

        {/* ─── Zig-Zag Skill Path ─── */}
        <View style={styles.pathContainer}>
          {/* Vertical connector track */}
          <View style={styles.verticalTrack} />

          {nodes.map((node) => (
            <ChunkyNode
              key={node.id}
              node={node}
              onPress={() => router.push('/sprint/standard' as any)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: colors.cardBorder,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: {
    fontSize: 18,
  },
  statNum: {
    fontSize: 17,
    fontWeight: '700',
  },

  syncBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  syncBannerText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // ── Mascot + Speech Bubble ──
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  mascotImg: {
    width: 80,
    height: 80,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: duo.radiusCard,
    padding: 14,
    marginLeft: 12,
    flex: 1,
    position: 'relative',
  },
  speechText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 22,
  },
  speechArrow: {
    position: 'absolute',
    left: -8,
    top: 18,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: colors.cardBorder,
  },

  // ── Sprint Card ──
  sprintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: duo.radiusCard,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: duo.depthCard + 2,
    borderBottomColor: '#D5D5D5',
    padding: 20,
    marginBottom: 28,
  },
  sprintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sprintTag: {
    fontSize: duo.fontSmall,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  sprintTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  progressTrack: {
    height: 16,
    backgroundColor: colors.cardBorder,
    borderRadius: duo.radiusProgress,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.duoGold,
    borderRadius: duo.radiusProgress,
  },
  progressLabel: {
    fontSize: duo.fontSmall,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 16,
  },
  startBtn: {
    borderRadius: duo.radiusButton,
    overflow: 'hidden',
  },
  startBtnInner: {
    backgroundColor: colors.duoGreen,
    paddingVertical: 14,
    borderRadius: duo.radiusButton,
    alignItems: 'center',
    borderBottomWidth: duo.depthButton,
    borderBottomColor: colors.duoGreenDark,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // ── Section Header ──
  sectionHeader: {
    fontSize: duo.fontCaption,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 24,
    textAlign: 'center',
  },

  // ── Zig-Zag Path ──
  pathContainer: {
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 10,
  },
  verticalTrack: {
    position: 'absolute',
    top: 40,
    bottom: 40,
    width: 8,
    backgroundColor: colors.cardBorder,
    borderRadius: 4,
  },

  // ── Node ──
  nodeWrapper: {
    alignItems: 'center',
    marginVertical: 14,
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    top: -34,
    backgroundColor: colors.duoGreen,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: duo.radiusCard,
    zIndex: 10,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: duo.fontSmall,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.duoGreen,
  },
  outerRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chunkyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 6,
  },
  nodeIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  nodeTitle: {
    marginTop: 6,
    fontSize: duo.fontCaption,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  nodeCategory: {
    fontSize: duo.fontSmall,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  nodeTitleLocked: {
    color: colors.textMuted,
  },
});
