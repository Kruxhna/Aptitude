import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PathNode } from '../../api';
import { usePathStore } from '../../stores/usePathStore';
import { useUserStore } from '../../stores/useUserStore';
import { colors, duo } from '../../theme';
import { SprintyMascot } from '../../components/SprintyMascot';
import { PathCanvas, ROW_HEIGHT, TOP_PADDING } from '../../components/PathCanvas';
import { NodePreviewTooltip } from '../../components/NodePreviewTooltip';
import haptics from '../../services/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Default Fallback DAG Nodes for Instant Offline Load ─────────
const DEFAULT_PATH_NODES: PathNode[] = [
  {
    id: 'node-1',
    skill: 'QUANTITATIVE',
    topic: 'Algebra & Ratios',
    description: 'Master linear equations, proportions, and algebraic expressions.',
    questionCount: 5,
    estimatedMinutes: 4,
    eloRequirement: 1000,
    xpReward: 35,
    state: 'PERFECT',
    isBranch: false,
    position: { x: 0.5, y: 0 },
    accuracy: 1.0,
  },
  {
    id: 'node-2',
    skill: 'VERBAL',
    topic: 'Vocabulary & Synonyms',
    description: 'Build core word power, contextual antonyms, and verbal clarity.',
    questionCount: 5,
    estimatedMinutes: 3,
    eloRequirement: 1020,
    xpReward: 30,
    state: 'COMPLETED',
    isBranch: false,
    position: { x: 0.64, y: 1 },
    accuracy: 0.8,
  },
  {
    id: 'node-2-branch-spatial',
    skill: 'SPATIAL',
    topic: '2D Rotations & Mirrors',
    description: 'Visualize planar rotations, reflections, and mirror symmetry.',
    questionCount: 5,
    estimatedMinutes: 4,
    eloRequirement: 1050,
    xpReward: 40,
    state: 'CURRENT',
    isBranch: true,
    branchParentId: 'node-2',
    mergeTargetId: 'node-3',
    position: { x: 0.18, y: 1.8 },
  },
  {
    id: 'node-3',
    skill: 'LOGICAL',
    topic: 'Deductive Syllogisms',
    description: 'Analyze premises, Venn deductions, and valid conclusions.',
    questionCount: 5,
    estimatedMinutes: 5,
    eloRequirement: 1060,
    xpReward: 45,
    state: 'LOCKED',
    isBranch: false,
    position: { x: 0.46, y: 2.6 },
  },
  {
    id: 'node-4',
    skill: 'QUANTITATIVE',
    topic: 'Percentages & Profit',
    description: 'Solve discounts, markup ratios, and compounded changes.',
    questionCount: 5,
    estimatedMinutes: 4,
    eloRequirement: 1080,
    xpReward: 35,
    state: 'LOCKED',
    isBranch: false,
    position: { x: 0.36, y: 3.6 },
  },
  {
    id: 'node-4-branch-verbal',
    skill: 'VERBAL',
    topic: 'Grammar & Error Spotting',
    description: 'Sentence correction, subject-verb agreement, and prepositions.',
    questionCount: 5,
    estimatedMinutes: 3,
    eloRequirement: 1100,
    xpReward: 30,
    state: 'LOCKED',
    isBranch: true,
    branchParentId: 'node-4',
    mergeTargetId: 'node-5',
    position: { x: 0.82, y: 4.4 },
  },
  {
    id: 'node-5',
    skill: 'LOGICAL',
    topic: 'Blood Relations & Direction',
    description: 'Family tree puzzles, compass bearings, and distance vectors.',
    questionCount: 5,
    estimatedMinutes: 4,
    eloRequirement: 1120,
    xpReward: 40,
    state: 'LOCKED',
    isBranch: false,
    position: { x: 0.50, y: 5.2 },
  },
  {
    id: 'node-6',
    skill: 'SPATIAL',
    topic: 'Paper Folding & Cutting',
    description: 'Transparent sheets, punched hole unfoldings, and pattern symmetry.',
    questionCount: 5,
    estimatedMinutes: 4,
    eloRequirement: 1140,
    xpReward: 40,
    state: 'LOCKED',
    isBranch: false,
    position: { x: 0.64, y: 6.2 },
  },
  {
    id: 'node-6-branch-quant',
    skill: 'QUANTITATIVE',
    topic: 'Speed, Time & Distance',
    description: 'Relative speed, trains, circular tracks, and boat streams.',
    questionCount: 5,
    estimatedMinutes: 5,
    eloRequirement: 1160,
    xpReward: 50,
    state: 'LOCKED',
    isBranch: true,
    branchParentId: 'node-6',
    mergeTargetId: 'node-7',
    position: { x: 0.18, y: 7.0 },
  },
  {
    id: 'node-7',
    skill: 'VERBAL',
    topic: 'Reading Comprehension',
    description: 'Passage inference, central themes, and tone evaluation.',
    questionCount: 5,
    estimatedMinutes: 5,
    eloRequirement: 1180,
    xpReward: 45,
    state: 'LOCKED',
    isBranch: false,
    position: { x: 0.50, y: 7.8 },
  },
  {
    id: 'node-8',
    skill: 'QUANTITATIVE',
    topic: 'Data Interpretation',
    description: 'Bar graphs, pie charts, tabular analysis, and trend forecasting.',
    questionCount: 5,
    estimatedMinutes: 5,
    eloRequirement: 1200,
    xpReward: 50,
    state: 'LOCKED',
    isBranch: false,
    position: { x: 0.36, y: 8.8 },
  },
  {
    id: 'node-9',
    skill: 'LOGICAL',
    topic: 'Seating Arrangements',
    description: 'Circular tables, multi-variable constraints, and matrix grids.',
    questionCount: 5,
    estimatedMinutes: 5,
    eloRequirement: 1220,
    xpReward: 50,
    state: 'LOCKED',
    isBranch: false,
    position: { x: 0.52, y: 9.8 },
  },
  {
    id: 'node-10',
    skill: 'SPATIAL',
    topic: '3D Cube & Block Projections',
    description: 'Orthographic projections, painted cubes, and isometric views.',
    questionCount: 5,
    estimatedMinutes: 4,
    eloRequirement: 1250,
    xpReward: 45,
    state: 'LOCKED',
    isBranch: false,
    position: { x: 0.64, y: 10.8 },
  },
  {
    id: 'node-11',
    skill: 'QUANTITATIVE',
    topic: 'Probability & Combinatorics',
    description: 'Permutations, combinations, conditional probability, and Bayes.',
    questionCount: 5,
    estimatedMinutes: 5,
    eloRequirement: 1280,
    xpReward: 55,
    state: 'LOCKED',
    isBranch: false,
    position: { x: 0.50, y: 11.8 },
  },
  {
    id: 'node-12',
    skill: 'QUANTITATIVE',
    topic: 'GATE Mastery Sprint',
    description: 'Grand comprehensive challenge across all 4 aptitude sections.',
    questionCount: 10,
    estimatedMinutes: 8,
    eloRequirement: 1300,
    xpReward: 100,
    state: 'LOCKED',
    isBranch: false,
    position: { x: 0.40, y: 12.8 },
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  // Granular atomic Zustand selectors
  const storeNodes = usePathStore((s) => s.nodes);
  const fetchPathTree = usePathStore((s) => s.fetchPathTree);

  const streakCount = useUserStore((s) => s.currentStreak);
  const totalXp = useUserStore((s) => s.totalXp);
  const currentLeague = useUserStore((s) => s.currentLeague);
  const userElo = useUserStore((s) => s.elo);
  const isPendingSync = useUserStore((s) => s.isPendingSync);
  const fetchUserProfile = useUserStore((s) => s.fetchUserProfile);

  const [refreshing, setRefreshing] = useState(false);
  const [initialScrolled, setInitialScrolled] = useState(false);

  // Tooltip State
  const [selectedNode, setSelectedNode] = useState<PathNode | null>(null);
  const [anchorLayout, setAnchorLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    pageX: number;
    pageY: number;
  } | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    fetchPathTree().catch(() => {});
    fetchUserProfile().catch(() => {});
  }, [fetchPathTree, fetchUserProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.impactLight();
    await Promise.all([
      fetchPathTree(true).catch(() => {}),
      fetchUserProfile().catch(() => {}),
    ]);
    setRefreshing(false);
  }, [fetchPathTree, fetchUserProfile]);

  const nodes = storeNodes && storeNodes.length > 0 ? storeNodes : DEFAULT_PATH_NODES;

  // Auto-Focus Active (CURRENT) Node
  useEffect(() => {
    if (!initialScrolled && nodes.length > 0) {
      const currentNode = nodes.find((n) => n.state === 'CURRENT');
      if (currentNode) {
        const nodeCanvasY = currentNode.position.y * ROW_HEIGHT + TOP_PADDING;
        const targetScrollY = Math.max(0, nodeCanvasY + 220 - SCREEN_HEIGHT / 2 + 60);

        const timer = setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: targetScrollY, animated: true });
          setInitialScrolled(true);
        }, 350);

        return () => clearTimeout(timer);
      }
    }
  }, [nodes, initialScrolled]);

  const handleNodePress = (
    node: PathNode,
    layout: { x: number; y: number; width: number; height: number; pageX: number; pageY: number }
  ) => {
    setSelectedNode(node);
    setAnchorLayout(layout);
    setTooltipVisible(true);
  };

  const handleStartSprint = (node: PathNode) => {
    setTooltipVisible(false);
    router.push({
      pathname: '/sprint/[type]',
      params: { type: 'standard', nodeId: node.id },
    } as any);
  };

  const currentNode = nodes.find((n) => n.state === 'CURRENT') || nodes[0];
  const completedCount = nodes.filter(
    (n) => n.state === 'COMPLETED' || n.state === 'PERFECT' || n.state === 'REVIEW'
  ).length;
  const progressPercent = Math.round((completedCount / nodes.length) * 100);

  const avgElo = Math.round(
    ((userElo.verbal || 1000) +
      (userElo.quantitative || 1000) +
      (userElo.logical || 1000) +
      (userElo.spatial || 1000)) /
      4
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ─── Top Stat Header Bar (Duolingo Pill Bar) ─── */}
      <View style={styles.topBar}>
        <View style={styles.statPill}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={[styles.statNum, { color: '#FF9600' }]}>{streakCount}</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statEmoji}>⚡</Text>
          <Text style={[styles.statNum, { color: '#FFC800' }]}>{totalXp.toLocaleString()}</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statEmoji}>🎯</Text>
          <Text style={[styles.statNum, { color: '#1CB0F6' }]}>{avgElo}</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statEmoji}>🏆</Text>
          <Text style={[styles.statNum, { color: '#CE82FF' }]}>
            {currentLeague || 'Bronze'}
          </Text>
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

      {/* ─── Scroll Container with Uniform Snapping ─── */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={ROW_HEIGHT}
        decelerationRate="fast"
        snapToAlignment="center"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ─── SPRINTY Companion + Dynamic Speech Bubble ─── */}
        <SprintyMascot
          size="md"
          showSpeechBubble={true}
          speechText="Next up:"
          speechHighlight={currentNode?.topic || 'GATE Aptitude'}
          style={styles.mascotRow}
        />

        {/* ─── Daily Sprint Card (3D Chunky) ─── */}
        <View style={styles.sprintCard}>
          <View style={styles.sprintRow}>
            <View>
              <Text style={styles.sprintTag}>GATE APTITUDE PATH</Text>
              <Text style={styles.sprintTitle}>
                {completedCount}/{nodes.length} Lessons Completed
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {progressPercent}% Path Mastery · {nodes.length - completedCount} lessons remaining
          </Text>

          {/* 3D Quick Start Button */}
          <TouchableOpacity
            style={styles.startBtn}
            activeOpacity={0.88}
            onPress={() => {
              haptics.buttonPress();
              router.push({
                pathname: '/sprint/[type]',
                params: { type: 'standard', nodeId: currentNode?.id },
              } as any);
            }}
          >
            <View style={styles.startBtnInner}>
              <Text style={styles.startBtnText}>CONTINUE SPRINT 🚀</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── Section Header ─── */}
        <View style={styles.pathHeaderRow}>
          <View style={styles.headerLine} />
          <Text style={styles.sectionHeader}>LEARNING PATH</Text>
          <View style={styles.headerLine} />
        </View>

        {/* ─── 2D Coordinate-Based Path Canvas with SVG Bezier Connectors ─── */}
        <View style={styles.canvasWrapper}>
          <PathCanvas
            nodes={nodes}
            onNodePress={handleNodePress}
            width={SCREEN_WIDTH - 20}
          />
        </View>
      </ScrollView>

      {/* ─── Floating Anchored Node Preview Tooltip ─── */}
      <NodePreviewTooltip
        node={selectedNode}
        anchorLayout={anchorLayout}
        visible={tooltipVisible}
        onDismiss={() => setTooltipVisible(false)}
        onStartSprint={handleStartSprint}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: colors.cardBorder,
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: 3,
    borderBottomColor: '#D5D5D5',
    gap: 5,
    flex: 1,
    justifyContent: 'center',
  },
  statEmoji: {
    fontSize: 16,
  },
  statNum: {
    fontSize: 14,
    fontWeight: '800',
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
    paddingBottom: 60,
    alignItems: 'center',
  },
  mascotRow: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  sprintCard: {
    width: SCREEN_WIDTH - 32,
    backgroundColor: '#FFFFFF',
    borderRadius: duo.radiusCard,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: 4,
    borderBottomColor: '#D5D5D5',
    padding: 16,
    marginVertical: 10,
  },
  sprintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sprintTag: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  sprintTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  progressTrack: {
    height: 12,
    backgroundColor: colors.cardBorder,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.duoGold,
    borderRadius: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 14,
  },
  startBtn: {
    borderRadius: duo.radiusButton,
    borderBottomWidth: 4,
    borderBottomColor: colors.duoGreenDark,
    overflow: 'hidden',
  },
  startBtnInner: {
    backgroundColor: colors.duoGreen,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  pathHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: SCREEN_WIDTH - 32,
    marginVertical: 18,
    gap: 12,
  },
  headerLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.cardBorder,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  canvasWrapper: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
  },
});
