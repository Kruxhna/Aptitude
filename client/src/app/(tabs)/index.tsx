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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api, PathNode, PathTreeResponse, UserMeResponse } from '../../api';
import { colors, duo } from '../../theme';
import { SpriteAnimator } from '../../components/SpriteAnimator';
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
    position: { x: 0.50, y: 0 },
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
    xpReward: 35,
    state: 'LOCKED',
    isBranch: true,
    branchParentId: 'node-4',
    mergeTargetId: 'node-5',
    position: { x: 0.82, y: 4.4 },
  },
  {
    id: 'node-5',
    skill: 'SPATIAL',
    topic: 'Paper Folding & Cuts',
    description: 'Trace punch patterns, symmetrical unfolds, and crease layouts.',
    questionCount: 5,
    estimatedMinutes: 4,
    eloRequirement: 1120,
    xpReward: 40,
    state: 'LOCKED',
    isBranch: false,
    position: { x: 0.52, y: 5.2 },
  },
  {
    id: 'node-6',
    skill: 'LOGICAL',
    topic: 'Blood Relations & Order',
    description: 'Map family trees, hierarchy ranks, and linear sequencing.',
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

  // ── State ───────────────────────────────────────────────────
  const [nodes, setNodes] = useState<PathNode[]>(DEFAULT_PATH_NODES);
  const [userStats, setUserStats] = useState<UserMeResponse | null>(null);
  const [pathStats, setPathStats] = useState<PathTreeResponse['stats'] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [initialScrolled, setInitialScrolled] = useState(false);

  // ── Tooltip State ───────────────────────────────────────────
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

  // ── Fetch Data ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [treeRes, userRes] = await Promise.all([
        api.getPathTree().catch(() => null),
        api.getUserMe().catch(() => null),
      ]);

      if (treeRes && Array.isArray(treeRes.nodes) && treeRes.nodes.length > 0) {
        setNodes(treeRes.nodes);
        setPathStats(treeRes.stats);
      }
      if (userRes) {
        setUserStats(userRes);
      }
    } catch (err) {
      console.warn('Failed to load path tree:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.impactLight();
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // ── Auto-Focus Active (CURRENT) Node ────────────────────────
  useEffect(() => {
    if (!initialScrolled && nodes.length > 0) {
      const currentNode = nodes.find((n) => n.state === 'CURRENT');
      if (currentNode) {
        // Calculate Y position in the canvas (accounting for sprint card above)
        // Sprint card & header height is ~240px
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

  // ── Node Tap Handler ────────────────────────────────────────
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
    // Navigate to sprint with nodeId query
    router.push({
      pathname: '/sprint/[type]',
      params: { type: 'standard', nodeId: node.id },
    } as any);
  };

  // Find the current active topic for the mascot speech bubble
  const currentNode = nodes.find((n) => n.state === 'CURRENT') || nodes[0];
  const completedCount = nodes.filter(
    (n) => n.state === 'COMPLETED' || n.state === 'PERFECT' || n.state === 'REVIEW'
  ).length;
  const progressPercent = Math.round((completedCount / nodes.length) * 100);

  // Overall stats
  const streakCount = userStats?.currentStreak ?? userStats?.streak?.current ?? 5;
  const totalXp = userStats?.totalXp ?? userStats?.xpTotal ?? 2450;
  const avgElo = userStats?.elo
    ? Math.round(
        ((userStats.elo.verbal || 1000) +
          (userStats.elo.quantitative || 1000) +
          (userStats.elo.logical || 1000) +
          (userStats.elo.spatial || 1000)) /
          4
      )
    : 1140;

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
            {userStats?.currentLeague || 'Bronze'}
          </Text>
        </View>
      </View>

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
        {/* ─── Mascot + Dynamic Speech Bubble ─── */}
        <View style={styles.mascotRow}>
          <SpriteAnimator
            source={require('../../../assets/sprites/sprinty_idle_hover_sprite.png')}
            style={styles.mascotImg}
            frameCount={4}
            fps={8}
          />
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>
              Next up:{'\n'}
              <Text style={styles.speechHighlight}>{currentNode?.topic || 'GATE Aptitude'}</Text>
            </Text>
            <View style={styles.speechArrow} />
          </View>
        </View>

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
    backgroundColor: '#FFFFFF',
  },

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: colors.cardBorder,
    zIndex: 30,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: {
    fontSize: 17,
  },
  statNum: {
    fontSize: 16,
    fontWeight: '800',
  },

  scrollContent: {
    padding: 10,
    paddingTop: 16,
    paddingBottom: 60,
  },

  // ── Mascot + Speech Bubble ──
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  mascotImg: {
    width: 76,
    height: 76,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: duo.radiusCard,
    borderBottomWidth: 4,
    borderBottomColor: '#D8D8D8',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginLeft: 14,
    flex: 1,
    position: 'relative',
  },
  speechText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 20,
  },
  speechHighlight: {
    color: colors.primaryDark,
    fontWeight: '900',
    fontSize: 15,
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
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: 5,
    borderBottomColor: '#D5D5D5',
    padding: 18,
    marginHorizontal: 10,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
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
    letterSpacing: 1.2,
  },
  sprintTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  progressTrack: {
    height: 14,
    backgroundColor: '#EEEEEE',
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
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 14,
  },
  startBtn: {
    borderRadius: duo.radiusButton,
    overflow: 'hidden',
  },
  startBtnInner: {
    backgroundColor: colors.duoGreen,
    paddingVertical: 13,
    borderRadius: duo.radiusButton,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: colors.duoGreenDark,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  // ── Section Header ──
  pathHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  headerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#EBEBEB',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.8,
  },

  // ── Canvas Wrapper ──
  canvasWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
